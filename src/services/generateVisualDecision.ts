import crypto from 'crypto';
import { InMemoryRunner } from '@google/adk';
import { visualDecisionAgent } from '../agents/visualDecisionAgent.js';
import type { CinematicGenerationContext } from '../domain/directorBrief.js';
import { ShotRecordSchema, type ShotRecord } from '../domain/shotRecord.js';
import { VisualDecisionProposalSchema, type VisualDecisionProposal } from '../domain/visualDecisionProposal.js';
import { VisualDecisionRecordSchema, type VisualDecisionRecord } from '../domain/visualDecisionRecord.js';
import { collectAdkResponseText, toModelRuntimeError } from '../utils/adkModelResponse.js';
import { parseJsonFromModelResponse } from '../utils/modelJson.js';
import {
  CINEMATIC_GUIDANCE_PRECEDENCE,
  cinematicDecisionProvenance,
  formatDirectorGuidance,
} from './directorGuidance.js';

export function validateShotForVisualDecision(shot: ShotRecord): void {
  const parsed = ShotRecordSchema.safeParse(shot);
  if (!parsed.success) {
    throw new Error(`Invalid ShotRecord schema: ${parsed.error.message}`);
  }

  if (shot.status !== 'APPROVED') {
    throw new Error(
      `ShotRecord is not approved: visual decision generation requires APPROVED status, current status is "${shot.status}".`
    );
  }
}

export function parseVisualDecisionProposal(rawText: string): VisualDecisionProposal {
  const payload = parseJsonFromModelResponse(rawText, 'Visual decision agent');
  const parsed = VisualDecisionProposalSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Visual decision proposal validation failed: ${parsed.error.message}`);
  }
  return parsed.data;
}

function disclosureLabel(category: ShotRecord['visualIntegrityCategory']): string {
  return category
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function deriveRequiredVisualDisclosure(
  shot: ShotRecord,
  proposal: VisualDecisionProposal
): string | null {
  if (proposal.riskLevel === 'LOW' || proposal.disclosure !== null) {
    return proposal.disclosure;
  }

  const label = disclosureLabel(shot.visualIntegrityCategory);
  if (shot.uncertaintyDisclosure) {
    return `${label}: ${shot.uncertaintyDisclosure}`;
  }

  return `${label}: this visual is an evidence-based representation and should not be interpreted as direct observation.`;
}

export function assembleVisualDecisionRecord(
  shot: ShotRecord,
  proposal: VisualDecisionProposal,
  options: {
    idFactory?: () => string;
    directorGuidance?: CinematicGenerationContext;
  } = {}
): VisualDecisionRecord {
  const validated = VisualDecisionProposalSchema.parse(proposal);
  const disclosure = deriveRequiredVisualDisclosure(shot, validated);

  const idFactory = options.idFactory ?? (() => `VD-${crypto.randomUUID()}`);
  const record = {
    id: idFactory(),
    researchQuestionId: shot.researchQuestionId,
    shotId: shot.id,
    category: shot.visualIntegrityCategory,
    decision: validated.decision,
    scientificConstraint: shot.scientificConstraint,
    disclosure,
    riskLevel: validated.riskLevel,
    decisionProvenance: cinematicDecisionProvenance(options.directorGuidance),
    status: 'REVIEW_REQUIRED' as const,
  };

  const parsed = VisualDecisionRecordSchema.safeParse(record);
  if (!parsed.success) {
    throw new Error(`Final VisualDecisionRecord validation failed: ${parsed.error.message}`);
  }

  return parsed.data;
}

export async function callVisualDecisionAgent(
  shot: ShotRecord,
  directorGuidance?: CinematicGenerationContext
): Promise<VisualDecisionProposal> {
  const runner = new InMemoryRunner({ agent: visualDecisionAgent });
  let responseText = '';

  const shotForModel = {
    description: shot.description,
    cameraDirection: shot.cameraDirection,
    visualIntegrityCategory: shot.visualIntegrityCategory,
    scientificConstraint: shot.scientificConstraint,
    uncertaintyDisclosure: shot.uncertaintyDisclosure,
  };

  try {
    const run = runner.runEphemeral({
      userId: 'system',
      newMessage: {
        parts: [
          {
            text: `Create one governed visual decision for this approved Shot. The application already owns and will attach all trusted IDs, the approved visualIntegrityCategory, and the approved scientificConstraint. Do not copy or return those trusted fields.\n\n${CINEMATIC_GUIDANCE_PRECEDENCE}\n\nHuman director guidance:\n${formatDirectorGuidance(directorGuidance)}\n\nApproved shot:\n${JSON.stringify(shotForModel, null, 2)}`,
          },
        ],
      },
    });

    responseText = await collectAdkResponseText(run, { label: 'Visual decision agent' });
  } catch (error) {
    throw toModelRuntimeError('Visual decision agent', error);
  }

  return parseVisualDecisionProposal(responseText);
}

export async function generateVisualDecision(
  shot: ShotRecord,
  modelCaller: (
    shot: ShotRecord,
    directorGuidance?: CinematicGenerationContext
  ) => Promise<VisualDecisionProposal> = callVisualDecisionAgent,
  options: {
    idFactory?: () => string;
    directorGuidance?: CinematicGenerationContext;
  } = {}
): Promise<VisualDecisionRecord> {
  validateShotForVisualDecision(shot);
  const proposal = await modelCaller(shot, options.directorGuidance);
  return assembleVisualDecisionRecord(shot, proposal, options);
}
