import { describe, expect, it, vi } from 'vitest';
import { type EvidenceRecord } from '../src/domain/evidenceRecord.js';
import { type ResearchQuestion } from '../src/domain/researchQuestion.js';
import {
  assembleClaimRecords,
  generateClaims,
  parseClaimProposalList,
  validateEvidenceForClaims,
} from '../src/services/generateClaims.js';

const approvedQuestion: ResearchQuestion = {
  id: 'RQ-europa-ocean',
  filmBriefId: 'FB-europa',
  question: 'What evidence supports a subsurface ocean on Europa?',
  purpose: 'Ground the film in observed evidence.',
  priority: 'HIGH',
  status: 'APPROVED',
};

const approvedEvidence: EvidenceRecord[] = [
  {
    id: 'EV-magnetic',
    sourceId: 'SRC-nasa-europa',
    researchQuestionId: approvedQuestion.id,
    excerpt: 'Galileo measurements strongly implied an electrically conductive fluid beneath Europa’s surface.',
    interpretation:
      'The measurement supports a conductive subsurface layer consistent with liquid material.',
    strength: 'HIGH',
    uncertainty:
      'The measurement supports conductivity but does not by itself establish exact composition or global extent.',
    status: 'APPROVED',
  },
];

const proposals = {
  claims: [
    {
      text: 'Galileo magnetic measurements provide strong evidence for a conductive subsurface layer on Europa.',
      evidenceIds: ['EV-magnetic'],
      confidence: 'HIGH' as const,
      uncertainty:
        'The evidence supports a conductive layer; exact composition and global extent require additional evidence.',
    },
  ],
};

describe('Approved Evidence → Claim governed generation', () => {
  it('parses valid structured claim proposals', () => {
    expect(parseClaimProposalList(JSON.stringify(proposals))).toEqual(proposals);
  });

  it('accepts a fenced JSON response from the model', () => {
    expect(parseClaimProposalList(````json\n${JSON.stringify(proposals)}\n````)).toEqual(proposals);
  });

  it('rejects non-approved evidence before model invocation', async () => {
    const evidence = [{ ...approvedEvidence[0], status: 'REVIEW_REQUIRED' as const }];
    const modelCaller = vi.fn(async () => proposals);

    await expect(generateClaims(evidence, approvedQuestion, modelCaller)).rejects.toThrow(
      'EvidenceRecord is not approved'
    );
    expect(modelCaller).not.toHaveBeenCalled();
  });

  it('rejects evidence/question provenance mismatches', () => {
    const evidence = [{ ...approvedEvidence[0], researchQuestionId: 'RQ-other' }];
    expect(() => validateEvidenceForClaims(evidence, approvedQuestion)).toThrow(
      'researchQuestionId mismatch'
    );
  });

  it('rejects claim proposals that cite evidence not supplied to the model', () => {
    expect(() =>
      assembleClaimRecords(
        approvedQuestion,
        approvedEvidence,
        {
          claims: [{ ...proposals.claims[0], evidenceIds: ['EV-invented'] }],
        },
        { idFactory: () => 'CL-fixed' }
      )
    ).toThrow('not supplied as approved evidence');
  });

  it('assembles application-owned ClaimRecords in REVIEW_REQUIRED state', () => {
    const claims = assembleClaimRecords(approvedQuestion, approvedEvidence, proposals, {
      idFactory: () => 'CL-fixed',
    });

    expect(claims).toEqual([
      {
        id: 'CL-fixed',
        researchQuestionId: approvedQuestion.id,
        evidenceIds: ['EV-magnetic'],
        text: proposals.claims[0].text,
        confidence: 'HIGH',
        uncertainty: proposals.claims[0].uncertainty,
        status: 'REVIEW_REQUIRED',
      },
    ]);
  });

  it('returns validated claims only from approved evidence', async () => {
    const modelCaller = vi.fn(async () => proposals);
    const claims = await generateClaims(approvedEvidence, approvedQuestion, modelCaller, {
      idFactory: () => 'CL-1',
    });

    expect(modelCaller).toHaveBeenCalledOnce();
    expect(claims[0]).toMatchObject({
      id: 'CL-1',
      researchQuestionId: approvedQuestion.id,
      evidenceIds: ['EV-magnetic'],
      status: 'REVIEW_REQUIRED',
    });
  });
});
