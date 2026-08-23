import { MvpSessionSchema, type MvpSession } from '../domain/mvpSession.js';

export const PUBLIC_DEMO_SESSION_ID = 'public-demo';

export function createPublicDemoSession(
  source: MvpSession,
  options: { now?: () => string } = {}
): MvpSession {
  const validated = MvpSessionSchema.parse(source);
  const productionPackage = validated.productionPackage;

  if (!productionPackage || productionPackage.status !== 'READY_FOR_PRODUCTION') {
    throw new Error('Only a READY_FOR_PRODUCTION session can be published as the public demo.');
  }
  if (!productionPackage.audit.passed) {
    throw new Error('The public demo requires a passing governance/provenance audit.');
  }

  const at = options.now?.() ?? new Date().toISOString();
  const state = {
    filmBrief: productionPackage.filmBrief,
    researchQuestions: productionPackage.researchQuestions,
    sources: productionPackage.sources,
    evidence: productionPackage.evidence,
    claims: productionPackage.claims,
    scriptLines: productionPackage.scriptLines,
    scenes: productionPackage.scenes,
    shots: productionPackage.shots,
    visualDecisions: productionPackage.visualDecisions,
    coverageWaivers: productionPackage.coverageWaivers ?? [],
    audit: productionPackage.audit,
  };

  return MvpSessionSchema.parse({
    id: PUBLIC_DEMO_SESSION_ID,
    rawIdea: productionPackage.filmBrief.scientificQuestion,
    createdAt: at,
    updatedAt: at,
    state,
    productionPackage,
    directorFeedback: [],
    reviewRecommendations: [],
    events: [
      {
        id: `EVT-public-demo-${Date.parse(at) || 0}`,
        type: 'SESSION_CREATED',
        at,
        stage: 'COMPLETE',
        message: 'Detached read-only public demo snapshot created from a completed Tital production package.',
      },
    ],
  });
}
