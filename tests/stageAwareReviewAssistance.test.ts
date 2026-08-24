import { describe, expect, it } from 'vitest';
import type { MvpSession } from '../src/domain/mvpSession.js';
import type { ReviewTargetType } from '../src/domain/reviewRecommendation.js';
import { assistMvpReview } from '../src/services/assistMvpReview.js';
import type { ReviewEvaluatorModelCaller } from '../src/services/evaluateReviewRecommendations.js';

const filmBrief = {
  id: 'FB-1',
  title: 'Aurora test',
  scientificTopic: 'Space physics',
  scientificQuestion: 'How do auroras form?',
  communicationObjective: 'Explain the evidence chain clearly.',
  targetAudience: 'General public',
  audienceKnowledgeLevel: 'No specialist background',
  format: 'Popular-science short',
  durationMinutes: 5,
  tone: 'Clear and cinematic',
  learningGoals: ['Understand auroral causation'],
  scope: ['Solar wind', 'Magnetosphere', 'Auroral emissions'],
  outOfScope: ['Advanced plasma derivations'],
  constraints: ['Preserve uncertainty'],
  researchRequirements: ['Use authoritative scientific sources'],
  status: 'APPROVED' as const,
};

const question = {
  id: 'RQ-1',
  filmBriefId: 'FB-1',
  question: 'What observations connect solar wind changes to auroral activity?',
  purpose: 'Ground the central causal chain.',
  priority: 'HIGH' as const,
  status: 'APPROVED' as const,
};

const source = {
  id: 'SRC-1',
  researchQuestionId: 'RQ-1',
  provider: 'PARALLEL' as const,
  providerSearchId: 'search-1',
  url: 'https://science.example/aurora',
  title: 'Auroral observations',
  publishDate: '2025-01-01',
  excerpts: ['Observed solar-wind changes precede measured magnetospheric responses.'],
  retrievedAt: '2026-08-24T00:00:00.000Z',
  status: 'APPROVED' as const,
};

const evidence = {
  id: 'EV-1',
  sourceId: 'SRC-1',
  researchQuestionId: 'RQ-1',
  excerpt: 'Observed solar-wind changes precede measured magnetospheric responses.',
  interpretation: 'The supplied observations connect changing solar-wind conditions with measured magnetospheric response.',
  strength: 'HIGH' as const,
  uncertainty: 'The observation alone does not establish every intermediate mechanism.',
  status: 'APPROVED' as const,
};

const claim = {
  id: 'CL-1',
  researchQuestionId: 'RQ-1',
  evidenceIds: ['EV-1'],
  text: 'Solar-wind changes are associated with measurable magnetospheric responses relevant to auroral activity.',
  confidence: 'HIGH' as const,
  uncertainty: 'The complete mechanism requires additional evidence.',
  status: 'APPROVED' as const,
};

const scriptLine = {
  id: 'SL-1',
  researchQuestionId: 'RQ-1',
  claimIds: ['CL-1'],
  text: 'Measurements show Earth’s magnetic environment responding as conditions in the solar wind change.',
  uncertaintyDisclosure: 'This is one measured part of a larger physical chain.',
  status: 'APPROVED' as const,
};

const scene = {
  id: 'SC-1',
  researchQuestionId: 'RQ-1',
  scriptLineIds: ['SL-1'],
  title: 'Solar wind reaches Earth',
  purpose: 'Connect upstream measurements to Earth’s magnetic environment.',
  visualSummary: 'Measured solar-wind data transitions into a restrained explanatory magnetosphere schematic.',
  uncertaintyDisclosure: 'The schematic is explanatory rather than a direct optical observation.',
  status: 'APPROVED' as const,
};

const shot = {
  id: 'SH-1',
  researchQuestionId: 'RQ-1',
  sceneId: 'SC-1',
  scriptLineIds: ['SL-1'],
  description: 'A restrained schematic shows solar-wind flow meeting Earth’s magnetosphere.',
  cameraDirection: 'Static wide framing with a slow push only if needed for clarity.',
  visualIntegrityCategory: 'SCHEMATIC' as const,
  scientificConstraint: 'Do not present field geometry as directly photographed structure.',
  uncertaintyDisclosure: 'Explanatory schematic based on measured and modeled understanding.',
  status: 'APPROVED' as const,
};

const visual = {
  id: 'VD-1',
  researchQuestionId: 'RQ-1',
  shotId: 'SH-1',
  category: 'SCHEMATIC' as const,
  decision: 'Use a labeled explanatory magnetic-field schematic over measured solar-wind context.',
  scientificConstraint: 'Clearly distinguish measured inputs from modeled field structure.',
  disclosure: 'Schematic visualization.',
  riskLevel: 'LOW' as const,
  status: 'APPROVED' as const,
};

function sessionFor(target: ReviewTargetType): MvpSession {
  const state = {
    filmBrief: { ...filmBrief },
    researchQuestions: [{ ...question }],
    sources: [{ ...source }],
    evidence: [{ ...evidence }],
    claims: [{ ...claim }],
    scriptLines: [{ ...scriptLine }],
    scenes: [{ ...scene }],
    shots: [{ ...shot }],
    visualDecisions: [{ ...visual }],
    coverageWaivers: [],
    audit: null,
  };

  if (target === 'FILM_BRIEF') {
    state.filmBrief.status = 'REVIEW_REQUIRED';
    state.researchQuestions = [];
    state.sources = [];
    state.evidence = [];
    state.claims = [];
    state.scriptLines = [];
    state.scenes = [];
    state.shots = [];
    state.visualDecisions = [];
  } else if (target === 'RESEARCH_QUESTION') {
    state.researchQuestions[0]!.status = 'REVIEW_REQUIRED';
    state.sources = [];
    state.evidence = [];
    state.claims = [];
    state.scriptLines = [];
    state.scenes = [];
    state.shots = [];
    state.visualDecisions = [];
  } else if (target === 'CLAIM') {
    state.claims[0]!.status = 'REVIEW_REQUIRED';
    state.scriptLines = [];
    state.scenes = [];
    state.shots = [];
    state.visualDecisions = [];
  } else if (target === 'SCRIPT') {
    state.scriptLines[0]!.status = 'REVIEW_REQUIRED';
    state.scenes = [];
    state.shots = [];
    state.visualDecisions = [];
  } else if (target === 'SCENE') {
    state.scenes[0]!.status = 'REVIEW_REQUIRED';
    state.shots = [];
    state.visualDecisions = [];
  } else if (target === 'SHOT') {
    state.shots[0]!.status = 'REVIEW_REQUIRED';
    state.visualDecisions = [];
  } else if (target === 'VISUAL') {
    state.visualDecisions[0]!.status = 'REVIEW_REQUIRED';
  } else {
    throw new Error(`Unsupported test target ${target}`);
  }

  return {
    id: `SESSION-${target}`,
    rawIdea: 'Explain auroras to a general audience.',
    projectInput: {
      rawIdea: 'Explain auroras to a general audience.',
      durationMinutes: 5,
      targetAudience: 'General public',
      audienceKnowledgeLevel: 'No specialist scientific background',
      format: 'Popular-science short',
      tone: 'Engaging, cinematic, accessible, scientifically rigorous',
      directorBrief: {
        collaborationMode: 'COLLABORATIVE',
        pacing: 'BALANCED',
        cameraMovement: 'BALANCED',
        representationPreference: 'REAL_IMAGERY_FIRST',
        avoid: ['Misleading visual certainty'],
      },
    },
    createdAt: '2026-08-24T00:00:00.000Z',
    updatedAt: '2026-08-24T00:00:00.000Z',
    state,
    productionPackage: null,
    events: [],
  };
}

const modelCaller: ReviewEvaluatorModelCaller = async (request) => ({
  recommendations: request.candidates.map((_, index) => ({
    candidateNumber: index + 1,
    recommendation: 'APPROVE_SUGGESTED',
    attention: request.targetType === 'SCRIPT' ? 'MEDIUM' : 'LOW',
    confidence: 0.9,
    reasons: [`${request.targetType} candidate is consistent with the supplied review context.`],
    risks: [],
    flags: request.targetType === 'SCRIPT' ? ['PACING_RISK'] : [],
  })),
});

function pendingStatus(session: MvpSession, target: ReviewTargetType): string | undefined {
  if (target === 'FILM_BRIEF') return session.state.filmBrief.status;
  if (target === 'RESEARCH_QUESTION') return session.state.researchQuestions[0]?.status;
  if (target === 'CLAIM') return session.state.claims[0]?.status;
  if (target === 'SCRIPT') return session.state.scriptLines[0]?.status;
  if (target === 'SCENE') return session.state.scenes[0]?.status;
  if (target === 'SHOT') return session.state.shots[0]?.status;
  if (target === 'VISUAL') return session.state.visualDecisions[0]?.status;
  return undefined;
}

describe('stage-aware AI review assistance', () => {
  const targets: ReviewTargetType[] = [
    'FILM_BRIEF',
    'RESEARCH_QUESTION',
    'CLAIM',
    'SCRIPT',
    'SCENE',
    'SHOT',
    'VISUAL',
  ];

  for (const target of targets) {
    it(`reviews ${target} without changing human approval status`, async () => {
      const original = sessionFor(target);
      const before = pendingStatus(original, target);
      const assisted = await assistMvpReview(original, {
        modelCaller,
        now: () => '2026-08-24T01:00:00.000Z',
        recommendationIdFactory: () => `REV-${target}`,
        eventIdFactory: () => `EVT-${target}`,
      });

      expect(before).toBe('REVIEW_REQUIRED');
      expect(pendingStatus(assisted, target)).toBe('REVIEW_REQUIRED');
      expect(assisted.reviewRecommendations).toHaveLength(1);
      expect(assisted.reviewRecommendations?.[0]).toMatchObject({
        id: `REV-${target}`,
        targetType: target,
        recommendation: 'APPROVE_SUGGESTED',
      });
      expect(assisted.events.at(-1)).toMatchObject({
        id: `EVT-${target}`,
        type: 'REVIEW_ASSISTED',
      });
      expect(assisted.events.at(-1)?.message).toContain('Human approval status was not changed');
    });
  }
});
