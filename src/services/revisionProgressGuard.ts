import type { MvpSession } from '../domain/mvpSession.js';
import type { RevisionRequest } from '../domain/revisionRequest.js';
import type { MvpWorkflowEvaluation } from './evaluateMvpWorkflow.js';

export function revisionAwaitingRepair(session: Pick<MvpSession, 'revisionRequests'>): RevisionRequest | null {
  return [...(session.revisionRequests ?? [])]
    .reverse()
    .find((revision) => revision.status === 'APPLIED') ?? null;
}

export function evaluationForRevisionAwaitingRepair(
  revision: RevisionRequest
): MvpWorkflowEvaluation {
  const stage = (() => {
    switch (revision.type) {
      case 'PROJECT_DURATION_CHANGE': return 'SCRIPT' as const;
      case 'SOURCE_APPROVAL_REVOKE': return 'RESEARCH' as const;
      case 'CLAIM_REVISION': return 'CLAIMS' as const;
      case 'SCRIPT_REVISION': return 'SCRIPT' as const;
      case 'SCENE_REVISION': return 'SCENES' as const;
      case 'SHOT_REVISION': return 'SHOTS' as const;
      case 'VISUAL_REVISION': return 'VISUAL_DECISIONS' as const;
    }
  })();

  return {
    stage,
    nextAction: 'Open the active governed revision and generate its selective repair before continuing the workflow.',
    blockedBy: ['REVISION_REPAIR_REQUIRED'],
  };
}
