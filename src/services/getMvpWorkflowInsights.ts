import type { MvpWorkflowStage, MvpWorkflowState } from '../domain/mvpWorkflow.js';
import { evaluateMvpWorkflow } from './evaluateMvpWorkflow.js';
import {
  missingApprovedCoverage,
  requiredResearchQuestionsForStage,
  requiredScenesForShots,
  requiredShotsForVisualDecisions,
  selectApprovedProductionChain,
} from './mvpWorkflowGuards.js';

export type WorkflowStepStatus = 'COMPLETE' | 'CURRENT' | 'UPCOMING';

export interface WorkflowStepInsight {
  stage: Exclude<MvpWorkflowStage, 'COMPLETE'>;
  label: string;
  status: WorkflowStepStatus;
}

export interface CoverageInsight {
  key:
    | 'sources'
    | 'evidence'
    | 'claims'
    | 'scriptLines'
    | 'scenes'
    | 'shots'
    | 'visualDecisions';
  label: string;
  parentLabel: string;
  childLabel: string;
  covered: number;
  waived: number;
  total: number;
  complete: boolean;
  missingParentIds: string[];
  waivedParentIds: string[];
}

export interface MvpWorkflowInsights {
  stage: MvpWorkflowStage;
  blockedBy: string[];
  steps: WorkflowStepInsight[];
  coverage: CoverageInsight[];
}

const WORKFLOW_STEPS: Array<{
  stage: Exclude<MvpWorkflowStage, 'COMPLETE'>;
  label: string;
}> = [
  { stage: 'DEFINE', label: 'Define' },
  { stage: 'RESEARCH', label: 'Research' },
  { stage: 'EVIDENCE', label: 'Evidence' },
  { stage: 'CLAIMS', label: 'Claims' },
  { stage: 'SCRIPT', label: 'Script' },
  { stage: 'SCENES', label: 'Scenes' },
  { stage: 'SHOTS', label: 'Shots' },
  { stage: 'VISUAL_DECISIONS', label: 'Visuals' },
  { stage: 'AUDIT', label: 'Audit' },
  { stage: 'PACKAGE', label: 'Package' },
];

function coverageItem<P extends { id: string }, C extends { status: string }>(
  key: CoverageInsight['key'],
  label: string,
  parentLabel: string,
  childLabel: string,
  allParents: readonly P[],
  requiredParents: readonly P[],
  children: readonly C[],
  childParentId: (child: C) => string
): CoverageInsight {
  const requiredIds = new Set(requiredParents.map((record) => record.id));
  const waivedParentIds = allParents
    .filter((record) => !requiredIds.has(record.id))
    .map((record) => record.id);
  const missing = missingApprovedCoverage(requiredParents, children, childParentId);
  const approvedCovered = requiredParents.length - missing.length;
  return {
    key,
    label,
    parentLabel,
    childLabel,
    covered: approvedCovered + waivedParentIds.length,
    waived: waivedParentIds.length,
    total: allParents.length,
    complete: allParents.length > 0 && missing.length === 0,
    missingParentIds: missing.map((record) => record.id),
    waivedParentIds,
  };
}

export function getMvpWorkflowInsights(
  state: MvpWorkflowState
): MvpWorkflowInsights {
  const evaluation = evaluateMvpWorkflow(state);
  const chain = selectApprovedProductionChain(state);

  const currentIndex =
    evaluation.stage === 'COMPLETE'
      ? WORKFLOW_STEPS.length
      : WORKFLOW_STEPS.findIndex((step) => step.stage === evaluation.stage);

  const steps = WORKFLOW_STEPS.map((step, index): WorkflowStepInsight => ({
    ...step,
    status:
      evaluation.stage === 'COMPLETE' || index < currentIndex
        ? 'COMPLETE'
        : index === currentIndex
          ? 'CURRENT'
          : 'UPCOMING',
  }));

  const sourceQuestions = requiredResearchQuestionsForStage(state, 'RESEARCH');
  const evidenceQuestions = requiredResearchQuestionsForStage(state, 'EVIDENCE');
  const claimQuestions = requiredResearchQuestionsForStage(state, 'CLAIMS');
  const scriptQuestions = requiredResearchQuestionsForStage(state, 'SCRIPT');
  const sceneQuestions = requiredResearchQuestionsForStage(state, 'SCENES');
  const requiredScenes = requiredScenesForShots(state);
  const requiredShots = requiredShotsForVisualDecisions(state);

  const coverage: CoverageInsight[] = [
    coverageItem(
      'sources',
      'Research question → source coverage',
      'approved research questions',
      'approved sources',
      chain.researchQuestions,
      sourceQuestions,
      chain.sources,
      (record) => record.researchQuestionId
    ),
    coverageItem(
      'evidence',
      'Research question → evidence coverage',
      'approved research questions',
      'approved evidence',
      chain.researchQuestions,
      evidenceQuestions,
      chain.evidence,
      (record) => record.researchQuestionId
    ),
    coverageItem(
      'claims',
      'Research question → claim coverage',
      'approved research questions',
      'approved claims',
      chain.researchQuestions,
      claimQuestions,
      chain.claims,
      (record) => record.researchQuestionId
    ),
    coverageItem(
      'scriptLines',
      'Research question → script coverage',
      'approved research questions',
      'approved script lines',
      chain.researchQuestions,
      scriptQuestions,
      chain.scriptLines,
      (record) => record.researchQuestionId
    ),
    coverageItem(
      'scenes',
      'Research question → scene coverage',
      'approved research questions',
      'approved scenes',
      chain.researchQuestions,
      sceneQuestions,
      chain.scenes,
      (record) => record.researchQuestionId
    ),
    coverageItem(
      'shots',
      'Scene → shot coverage',
      'approved scenes',
      'approved shots',
      chain.scenes,
      requiredScenes,
      chain.shots,
      (record) => record.sceneId
    ),
    coverageItem(
      'visualDecisions',
      'Shot → visual decision coverage',
      'approved shots',
      'approved visual decisions',
      chain.shots,
      requiredShots,
      chain.visualDecisions,
      (record) => record.shotId
    ),
  ];

  return {
    stage: evaluation.stage,
    blockedBy: evaluation.blockedBy,
    steps,
    coverage,
  };
}
