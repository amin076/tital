import type { MvpWorkflowStage, MvpWorkflowState } from '../domain/mvpWorkflow.js';
import { evaluateMvpWorkflow } from './evaluateMvpWorkflow.js';
import {
  missingApprovedCoverage,
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
  total: number;
  complete: boolean;
  missingParentIds: string[];
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
  parents: readonly P[],
  children: readonly C[],
  childParentId: (child: C) => string
): CoverageInsight {
  const missing = missingApprovedCoverage(parents, children, childParentId);
  return {
    key,
    label,
    parentLabel,
    childLabel,
    covered: parents.length - missing.length,
    total: parents.length,
    complete: parents.length > 0 && missing.length === 0,
    missingParentIds: missing.map((record) => record.id),
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

  const coverage: CoverageInsight[] = [
    coverageItem(
      'sources',
      'Research question → source coverage',
      'approved research questions',
      'approved sources',
      chain.researchQuestions,
      chain.sources,
      (record) => record.researchQuestionId
    ),
    coverageItem(
      'evidence',
      'Source → evidence coverage',
      'approved sources',
      'approved evidence',
      chain.sources,
      chain.evidence,
      (record) => record.sourceId
    ),
    coverageItem(
      'claims',
      'Research question → claim coverage',
      'approved research questions',
      'approved claims',
      chain.researchQuestions,
      chain.claims,
      (record) => record.researchQuestionId
    ),
    coverageItem(
      'scriptLines',
      'Research question → script coverage',
      'approved research questions',
      'approved script lines',
      chain.researchQuestions,
      chain.scriptLines,
      (record) => record.researchQuestionId
    ),
    coverageItem(
      'scenes',
      'Research question → scene coverage',
      'approved research questions',
      'approved scenes',
      chain.researchQuestions,
      chain.scenes,
      (record) => record.researchQuestionId
    ),
    coverageItem(
      'shots',
      'Scene → shot coverage',
      'approved scenes',
      'approved shots',
      chain.scenes,
      chain.shots,
      (record) => record.sceneId
    ),
    coverageItem(
      'visualDecisions',
      'Shot → visual decision coverage',
      'approved shots',
      'approved visual decisions',
      chain.shots,
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
