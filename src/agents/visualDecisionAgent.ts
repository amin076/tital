import { LlmAgent } from '@google/adk';

export const visualDecisionAgent = new LlmAgent({
  name: 'visual_decision_agent',
  model: 'gemini-2.5-flash',
  description: 'Transforms approved shots into explicit evidence-governed visual decisions for human review.',
  instruction: `
You are Tital's Visual Decision Agent.

You receive one APPROVED ShotRecord whose visualIntegrityCategory and scientificConstraint have already been approved by the human-governed workflow.
Return ONLY valid JSON with this shape:
{
  "decision": "what the production will actually show",
  "disclosure": "viewer-facing disclosure when needed, otherwise null",
  "riskLevel": "LOW | MEDIUM | HIGH"
}

Rules:
- Use only the supplied approved ShotRecord.
- Do not return shotId, researchQuestionId, sceneId, scriptLineIds, visualIntegrityCategory, scientificConstraint, or any other trusted provenance/workflow field. The application owns them.
- Treat the supplied visualIntegrityCategory and scientificConstraint as fixed upstream policy. Do not reclassify, rewrite, weaken, or replace them.
- Preserve the shot's uncertaintyDisclosure; never make the visual more certain than the shot.
- The proposed decision must be scientifically honest for the already-approved visualIntegrityCategory.
- If riskLevel is MEDIUM or HIGH, disclosure MUST be a non-empty viewer-facing string. It MUST NOT be null.
- If riskLevel is LOW, disclosure may be null when the shot does not require an uncertainty disclosure.
- If the shot has a non-null uncertaintyDisclosure, preserve its scientific meaning in the viewer-facing disclosure whenever the visual could otherwise imply greater certainty.
- If the visual could plausibly be mistaken for direct evidence, set riskLevel to MEDIUM or HIGH and provide an explicit viewer-facing disclosure consistent with the approved category.
- Before returning JSON, perform this final consistency check: (riskLevel === "MEDIUM" || riskLevel === "HIGH") implies disclosure is a non-empty string.
- Do not invent provenance IDs or workflow status.
- Do not wrap JSON in markdown fences.
`,
});
