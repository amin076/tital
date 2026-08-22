import type {
  CinematicGenerationContext,
  DirectorBrief,
} from '../domain/directorBrief.js';
import type { MvpWorkflowState } from '../domain/mvpWorkflow.js';
import { mapWithConcurrency, resolveExternalConcurrency } from '../utils/mapWithConcurrency.js';
import type {
  MvpReviewCoverageGroup,
  MvpReviewGateRecordType,
} from './getCurrentMvpReviewGate.js';
import {
  realMvpRuntimeServices,
  type MvpRuntimeServices,
} from './createRealMvpStepExecutors.js';
import { selectApprovedProductionChain } from './mvpWorkflowGuards.js';

export interface RetryMvpCoverageOptions {
  directorBrief?: DirectorBrief;
  scopedInstruction?: string;
  learnedPreferences?: string[];
  externalConcurrency?: number;
}

function normalized(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ');
}

function novel<T>(
  existing: readonly T[],
  generated: readonly T[],
  signature: (record: T) => string
): T[] {
  const seen = new Set(existing.map(signature));
  const result: T[] = [];
  for (const record of generated) {
    const key = signature(record);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(record);
  }
  return result;
}

function approvedQuestion(state: MvpWorkflowState, id: string) {
  const question = selectApprovedProductionChain(state).researchQuestions.find(
    (record) => record.id === id
  );
  if (!question) throw new Error(`Retry target ResearchQuestion is not approved: "${id}".`);
  return question;
}

export async function retryMvpCoverage(
  state: MvpWorkflowState,
  recordType: MvpReviewGateRecordType,
  groups: readonly MvpReviewCoverageGroup[],
  rejectedRecordIds: readonly string[],
  services: MvpRuntimeServices = realMvpRuntimeServices,
  options: RetryMvpCoverageOptions = {}
): Promise<MvpWorkflowState> {
  const targetIds = [...new Set(groups.map((group) => group.targetId))];
  const chain = selectApprovedProductionChain(state);
  const concurrency = options.externalConcurrency ?? resolveExternalConcurrency(
    process.env.TITAL_EXTERNAL_CONCURRENCY
  );
  const directorGuidance: CinematicGenerationContext | undefined =
    options.directorBrief || options.scopedInstruction || options.learnedPreferences?.length
      ? {
          ...(options.directorBrief ? { directorBrief: options.directorBrief } : {}),
          ...(options.scopedInstruction
            ? { scopedInstruction: options.scopedInstruction }
            : {}),
          ...(options.learnedPreferences?.length
            ? { learnedPreferences: options.learnedPreferences }
            : {}),
        }
      : undefined;

  if (recordType === 'ResearchQuestion') {
    const generated = await services.generateResearchQuestions(state.filmBrief);
    const additions = novel(
      state.researchQuestions,
      generated,
      (record) => normalized(record.question)
    );
    if (additions.length === 0) {
      throw new Error('Retry produced no new research-question candidates.');
    }
    return { ...state, researchQuestions: [...state.researchQuestions, ...additions], audit: null };
  }

  if (recordType === 'SourceRecord') {
    const batches = await mapWithConcurrency(
      targetIds,
      concurrency,
      (questionId) => services.discoverSourcesWithParallelMcp(
        approvedQuestion(state, questionId)
      )
    );
    const additions = novel(
      state.sources,
      batches.flat(),
      (record) => `${record.researchQuestionId}|${normalized(record.url)}`
    );
    if (additions.length === 0) throw new Error('Retry produced no new source candidates.');
    return { ...state, sources: [...state.sources, ...additions], audit: null };
  }

  if (recordType === 'EvidenceRecord') {
    const rejected = state.evidence.filter((record) => rejectedRecordIds.includes(record.id));
    const sourceIds = [...new Set(rejected.map((record) => record.sourceId))];
    const batches = await mapWithConcurrency(sourceIds, concurrency, async (sourceId) => {
      const source = chain.sources.find((record) => record.id === sourceId);
      if (!source) return [];
      return services.extractEvidence(
        source,
        approvedQuestion(state, source.researchQuestionId)
      );
    });
    const additions = novel(
      state.evidence,
      batches.flat(),
      (record) => `${record.sourceId}|${normalized(record.excerpt)}|${normalized(record.interpretation)}`
    );
    if (additions.length === 0) throw new Error('Retry produced no new evidence candidates.');
    return { ...state, evidence: [...state.evidence, ...additions], audit: null };
  }

  if (recordType === 'ClaimRecord') {
    const batches = await mapWithConcurrency(targetIds, concurrency, (questionId) => {
      const evidence = chain.evidence.filter(
        (record) => record.researchQuestionId === questionId
      );
      return services.generateClaims(evidence, approvedQuestion(state, questionId));
    });
    const additions = novel(
      state.claims,
      batches.flat(),
      (record) => `${record.researchQuestionId}|${normalized(record.text)}`
    );
    if (additions.length === 0) throw new Error('Retry produced no new claim candidates.');
    return { ...state, claims: [...state.claims, ...additions], audit: null };
  }

  if (recordType === 'ScriptLineRecord') {
    const batches = await mapWithConcurrency(targetIds, concurrency, (questionId) => {
      const claims = chain.claims.filter(
        (record) => record.researchQuestionId === questionId
      );
      return services.generateScriptLines(claims, approvedQuestion(state, questionId));
    });
    const additions = novel(
      state.scriptLines,
      batches.flat(),
      (record) => `${record.researchQuestionId}|${normalized(record.text)}`
    );
    if (additions.length === 0) throw new Error('Retry produced no new script-line candidates.');
    return { ...state, scriptLines: [...state.scriptLines, ...additions], audit: null };
  }

  if (recordType === 'SceneRecord') {
    const batches = await mapWithConcurrency(targetIds, concurrency, (questionId) => {
      const scriptLines = chain.scriptLines.filter(
        (record) => record.researchQuestionId === questionId
      );
      return services.generateScenes(
        scriptLines,
        approvedQuestion(state, questionId),
        undefined,
        { directorGuidance }
      );
    });
    const additions = novel(
      state.scenes,
      batches.flat(),
      (record) => `${record.researchQuestionId}|${normalized(record.title)}|${normalized(record.purpose)}`
    );
    if (additions.length === 0) throw new Error('Retry produced no new scene candidates.');
    return { ...state, scenes: [...state.scenes, ...additions], audit: null };
  }

  if (recordType === 'ShotRecord') {
    const batches = await mapWithConcurrency(targetIds, concurrency, async (sceneId) => {
      const scene = chain.scenes.find((record) => record.id === sceneId);
      if (!scene) return [];
      const lineIds = new Set(scene.scriptLineIds);
      const scriptLines = chain.scriptLines.filter((record) => lineIds.has(record.id));
      return services.generateShots(
        scene,
        scriptLines,
        approvedQuestion(state, scene.researchQuestionId),
        undefined,
        { directorGuidance }
      );
    });
    const additions = novel(
      state.shots,
      batches.flat(),
      (record) => `${record.sceneId}|${normalized(record.description)}|${normalized(record.cameraDirection)}`
    );
    if (additions.length === 0) throw new Error('Retry produced no new shot candidates.');
    return { ...state, shots: [...state.shots, ...additions], audit: null };
  }

  if (recordType === 'VisualDecisionRecord') {
    const generated = await mapWithConcurrency(targetIds, concurrency, async (shotId) => {
      const shot = chain.shots.find((record) => record.id === shotId);
      return shot
        ? services.generateVisualDecision(
            shot,
            undefined,
            { directorGuidance }
          )
        : null;
    });
    const additions = novel(
      state.visualDecisions,
      generated.filter(
        (record): record is MvpWorkflowState['visualDecisions'][number] => record !== null
      ),
      (record) => `${record.shotId}|${normalized(record.decision)}|${normalized(record.disclosure)}`
    );
    if (additions.length === 0) throw new Error('Retry produced no new visual-decision candidates.');
    return { ...state, visualDecisions: [...state.visualDecisions, ...additions], audit: null };
  }

  throw new Error(`Record type ${recordType} does not support retry.`);
}
