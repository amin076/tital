import crypto from 'crypto';
import { InMemoryRunner, stringifyContent } from '@google/adk';
import { visualDecisionAgent } from '../agents/visualDecisionAgent.js';
import { ShotRecordSchema, type ShotRecord } from '../domain/shotRecord.js';
import { VisualDecisionProposalSchema, type VisualDecisionProposal } from '../domain/visualDecisionProposal.js';
import { VisualDecisionRecordSchema, type VisualDecisionRecord } from '../domain/visualDecisionRecord.js';
import { parseJsonFromModelResponse } from '../utils/modelJson.js';

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

function disclosureLabel(category: VisualDecisionProposal['category']): string {
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

  const label = disclosureLabel(proposal.category);
  if (shot.uncertaintyDisclosure) {
    return `${label}: ${shot.uncertaintyDisclosure}`;
  }

  return `${label}: this visual is an evidence-based representation and should not be interpreted as direct observation.`;
}

export function assembleVisualDecisionRecord(
  shot: ShotRecord,
  proposal: VisualDecisionProposal,
  options: { idFactory?: () => string } = {}
): VisualDecisionRecord {
  const validated = VisualDecisionProposalSchema.parse(proposal);

  if (validated.shotId !== shot.id) {
    throw new Error(
      `Visual decision proposal shotId mismatch: expected "${shot.id}", received "${validated.shotId}".`
    );
  }

  if (validated.category !== shot.visualIntegrityCategory) {
    throw new Error(
      `Visual integrity category mismatch: approved shot is "${shot.visualIntegrityCategory}", proposal is "${validated.category}".`
    );
  }

  const disclosure = deriveRequiredVisualDisclosure(shot, validated);

  const idFactory = options.idFactory ?? (() => `VD-${crypto.randomUUID()}`);
  const record = {
    id: idFactory(),
    researchQuestionId: shot.researchQuestionId,
    shotId: shot.id,
    category: validated.category,
    decision: validated.decision,
    scientificConstraint: validated.scientificConstraint,
    disclosure,
    riskLevel: validated.riskLevel,
    status: 'REVIEW_REQUIRED' as const,
  };

  const parsed = VisualDecisionRecordSchema.safeParse(record);
  if (!parsed.success) {
    throw new Error(`Final VisualDecisionRecord validation failed: ${parsed.error.message}`);
  }

  return parsed.data;
}

export async function callVisualDecisionAgent(shot: ShotRecord): Promise<VisualDecisionProposal> {
  const runner = new InMemoryRunner({ agent: visualDecisionAgent });
  let responseText = '';

  try {
    const run = runner.runEphemeral({
      userId: 'system',
      newMessage: {
        parts: [{ text: `Create one governed visual decision for this approved ShotRecord.\n\n${JSON.stringify(shot, null, 2)}` }],
      },
    });

    for await (const event of run) {
      responseText += stringifyContent(event);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Visual decision ADK/model invocation failure: ${message}`);
  }

  return parseVisualDecisionProposal(responseText);
}

export async function generateVisualDecision(
  shot: ShotRecord,
  modelCaller: (shot: ShotRecord) => Promise<VisualDecisionProposal> = callVisualDecisionAgent,
  options: { idFactory?: () => string } = {}
): Promise<VisualDecisionRecord> {
  validateShotForVisualDecision(shot);
  const proposal = await modelCaller(shot);
  return assembleVisualDecisionRecord(shot, proposal, options);
}
