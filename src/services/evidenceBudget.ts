import type { EvidenceRecord } from '../domain/evidenceRecord.js';
import type { MvpWorkflowState } from '../domain/mvpWorkflow.js';
import type { ResearchQuestion } from '../domain/researchQuestion.js';
import { approvedOnly, requiredResearchQuestionsForStage } from './mvpWorkflowGuards.js';

export const ARCHIVED_EVIDENCE_STATUS = 'ARCHIVED_CANDIDATE' as const;

export interface EvidenceBudgetQuestionSummary {
  researchQuestionId: string;
  priority: ResearchQuestion['priority'];
  candidateCount: number;
  promotedCount: number;
  archivedCount: number;
  target: number;
}

export interface EvidenceBudgetSummary {
  mode: 'AUTO';
  durationMinutes: number;
  candidateCount: number;
  promotedCount: number;
  archivedCount: number;
  approvedCount: number;
  targetBudget: number;
  reductionPercent: number;
  questions: EvidenceBudgetQuestionSummary[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Human-facing evidence should scale with the film, not with the raw amount of
 * extractable text. The broad research corpus stays in state, while this budget
 * controls how much candidate evidence enters the review/production chain.
 */
export function targetEvidenceBudget(durationMinutes: number, questionCount: number): number {
  const duration = clamp(durationMinutes, 0.5, 180);
  let baseline: number;
  if (duration <= 3) baseline = 12;
  else if (duration <= 5) baseline = 24;
  else if (duration <= 10) baseline = 36;
  else if (duration <= 20) baseline = 54;
  else if (duration <= 30) baseline = 72;
  else baseline = Math.min(120, Math.round(72 + (duration - 30) * 0.8));

  // Preserve at least two review opportunities per active question when the
  // candidate pool can support it.
  return Math.max(baseline, Math.max(1, questionCount) * 2);
}

function priorityWeight(priority: ResearchQuestion['priority']): number {
  if (priority === 'HIGH') return 3;
  if (priority === 'MEDIUM') return 2;
  return 1;
}

function normalizedTokens(record: EvidenceRecord): Set<string> {
  return new Set(
    `${record.excerpt} ${record.interpretation}`
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length >= 4)
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return intersection / (a.size + b.size - intersection);
}

function evidenceScore(record: EvidenceRecord): number {
  const strength = record.strength === 'HIGH' ? 3 : record.strength === 'MEDIUM' ? 2 : 1;
  const fullSource = record.grounding?.mode === 'PARALLEL_WEB_FETCH' ? 2 : 0;
  // A disclosed limitation is useful scientific metadata, not a reason to hide
  // evidence from review. Give it a small positive tie-breaker.
  const uncertaintyDisclosure = record.uncertainty ? 0.25 : 0;
  return strength + fullSource + uncertaintyDisclosure;
}

function allocateTargets(
  questions: ResearchQuestion[],
  budget: number,
  candidatesByQuestion: Map<string, EvidenceRecord[]>
): Map<string, number> {
  const targets = new Map<string, number>();
  if (questions.length === 0 || budget <= 0) return targets;

  let remaining = budget;
  // First guarantee one item per question when possible.
  for (const question of questions) {
    const available = candidatesByQuestion.get(question.id)?.length ?? 0;
    const initial = available > 0 && remaining > 0 ? 1 : 0;
    targets.set(question.id, initial);
    remaining -= initial;
  }

  while (remaining > 0) {
    const eligible = questions.filter((question) => {
      const available = candidatesByQuestion.get(question.id)?.length ?? 0;
      return (targets.get(question.id) ?? 0) < available;
    });
    if (eligible.length === 0) break;
    eligible.sort((a, b) => {
      const weightDiff = priorityWeight(b.priority) - priorityWeight(a.priority);
      if (weightDiff !== 0) return weightDiff;
      const aTarget = targets.get(a.id) ?? 0;
      const bTarget = targets.get(b.id) ?? 0;
      if (aTarget !== bTarget) return aTarget - bTarget;
      return a.id.localeCompare(b.id);
    });
    const chosen = eligible[0];
    targets.set(chosen.id, (targets.get(chosen.id) ?? 0) + 1);
    remaining -= 1;
  }

  return targets;
}

function chooseForQuestion(candidates: EvidenceRecord[], target: number): Set<string> {
  if (target <= 0) return new Set();
  if (candidates.length <= target) return new Set(candidates.map((record) => record.id));

  const ranked = [...candidates].sort((a, b) => {
    const scoreDiff = evidenceScore(b) - evidenceScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    const sourceDiff = a.sourceId.localeCompare(b.sourceId);
    return sourceDiff !== 0 ? sourceDiff : a.id.localeCompare(b.id);
  });

  const selected: EvidenceRecord[] = [];
  const deferred: EvidenceRecord[] = [];
  const sourceIds = new Set<string>();
  const tokenCache = new Map(ranked.map((record) => [record.id, normalizedTokens(record)]));

  function materiallyDistinct(record: EvidenceRecord): boolean {
    const tokens = tokenCache.get(record.id) ?? new Set<string>();
    return selected.every((existing) =>
      jaccard(tokens, tokenCache.get(existing.id) ?? new Set<string>()) < 0.72
    );
  }

  // First pass favors source diversity and non-duplicate information.
  for (const record of ranked) {
    if (selected.length >= target) break;
    if (!sourceIds.has(record.sourceId) && materiallyDistinct(record)) {
      selected.push(record);
      sourceIds.add(record.sourceId);
    } else {
      deferred.push(record);
    }
  }

  // Second pass fills any remaining quota with the strongest deferred records.
  for (const record of deferred) {
    if (selected.length >= target) break;
    if (!selected.some((candidate) => candidate.id === record.id)) selected.push(record);
  }

  return new Set(selected.map((record) => record.id));
}

export function applyAdaptiveEvidenceBudget(state: MvpWorkflowState): MvpWorkflowState {
  const activeQuestions = requiredResearchQuestionsForStage(state, 'EVIDENCE');
  const activeQuestionIds = new Set(activeQuestions.map((record) => record.id));
  const approvedSourceIds = new Set(approvedOnly(state.sources).map((record) => record.id));
  const mutableCandidates = state.evidence.filter(
    (record) =>
      activeQuestionIds.has(record.researchQuestionId) &&
      approvedSourceIds.has(record.sourceId) &&
      (record.status === 'REVIEW_REQUIRED' || record.status === ARCHIVED_EVIDENCE_STATUS)
  );

  if (mutableCandidates.length === 0) return state;

  const candidatesByQuestion = new Map<string, EvidenceRecord[]>();
  for (const record of mutableCandidates) {
    candidatesByQuestion.set(record.researchQuestionId, [
      ...(candidatesByQuestion.get(record.researchQuestionId) ?? []),
      record,
    ]);
  }

  const targetBudget = Math.min(
    mutableCandidates.length,
    targetEvidenceBudget(state.filmBrief.durationMinutes, activeQuestions.length)
  );
  const targets = allocateTargets(activeQuestions, targetBudget, candidatesByQuestion);
  const promotedIds = new Set<string>();
  for (const question of activeQuestions) {
    const candidates = candidatesByQuestion.get(question.id) ?? [];
    const selected = chooseForQuestion(candidates, targets.get(question.id) ?? 0);
    for (const id of selected) promotedIds.add(id);
  }

  return {
    ...state,
    evidence: state.evidence.map((record) => {
      if (!mutableCandidates.some((candidate) => candidate.id === record.id)) return record;
      return {
        ...record,
        status: promotedIds.has(record.id) ? 'REVIEW_REQUIRED' : ARCHIVED_EVIDENCE_STATUS,
      };
    }),
  };
}

export function summarizeEvidenceBudget(state: MvpWorkflowState): EvidenceBudgetSummary {
  const activeQuestions = requiredResearchQuestionsForStage(state, 'EVIDENCE');
  const relevantQuestionIds = new Set(activeQuestions.map((record) => record.id));
  const relevant = state.evidence.filter((record) => relevantQuestionIds.has(record.researchQuestionId));
  const promoted = relevant.filter((record) => record.status === 'REVIEW_REQUIRED');
  const archived = relevant.filter((record) => record.status === ARCHIVED_EVIDENCE_STATUS);
  const approved = relevant.filter((record) => record.status === 'APPROVED');
  const candidateCount = promoted.length + archived.length + approved.length;
  const targetBudget = Math.min(
    candidateCount,
    targetEvidenceBudget(state.filmBrief.durationMinutes, activeQuestions.length)
  );

  return {
    mode: 'AUTO',
    durationMinutes: state.filmBrief.durationMinutes,
    candidateCount,
    promotedCount: promoted.length,
    archivedCount: archived.length,
    approvedCount: approved.length,
    targetBudget,
    reductionPercent: candidateCount > 0
      ? Math.round((archived.length / candidateCount) * 100)
      : 0,
    questions: activeQuestions.map((question) => {
      const records = relevant.filter((record) => record.researchQuestionId === question.id);
      const candidates = records.filter((record) =>
        ['REVIEW_REQUIRED', ARCHIVED_EVIDENCE_STATUS, 'APPROVED'].includes(record.status)
      );
      return {
        researchQuestionId: question.id,
        priority: question.priority,
        candidateCount: candidates.length,
        promotedCount: candidates.filter((record) => record.status === 'REVIEW_REQUIRED').length,
        archivedCount: candidates.filter((record) => record.status === ARCHIVED_EVIDENCE_STATUS).length,
        target: 0,
      };
    }),
  };
}
