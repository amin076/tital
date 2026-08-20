import {
  CinematicGenerationContextSchema,
  type CinematicGenerationContext,
} from '../domain/directorBrief.js';
import type { CinematicDecisionProvenance } from '../domain/cinematicDecisionProvenance.js';

export function formatDirectorGuidance(
  context: CinematicGenerationContext | undefined
): string {
  if (!context) return 'No explicit director guidance was supplied. Use restrained, evidence-led cinematic judgement.';
  const parsed = CinematicGenerationContextSchema.parse(context);
  const brief = parsed.directorBrief;
  const lines: string[] = [];

  if (brief) {
    lines.push(`Collaboration mode: ${brief.collaborationMode}`);
    lines.push(`Pacing: ${brief.pacing}`);
    lines.push(`Camera movement: ${brief.cameraMovement}`);
    lines.push(`Representation preference: ${brief.representationPreference}`);
    if (brief.visualStyle) lines.push(`Visual style: ${brief.visualStyle}`);
    if (brief.notes) lines.push(`Project director notes: ${brief.notes}`);
    if (brief.avoid.length > 0) lines.push(`Avoid: ${brief.avoid.join('; ')}`);
  }
  if (parsed.scopedInstruction) {
    lines.push(`Scoped director instruction for this replacement/generation: ${parsed.scopedInstruction}`);
  }

  return lines.length > 0
    ? lines.join('\n')
    : 'No explicit director guidance was supplied. Use restrained, evidence-led cinematic judgement.';
}

export function cinematicDecisionProvenance(
  context: CinematicGenerationContext | undefined
): CinematicDecisionProvenance {
  const parsed = context ? CinematicGenerationContextSchema.parse(context) : undefined;
  return {
    recommendationSource: 'AI',
    evidenceGoverned: true,
    directorBriefApplied: Boolean(parsed?.directorBrief),
    directorInstruction: parsed?.scopedInstruction ?? null,
  };
}

export const CINEMATIC_GUIDANCE_PRECEDENCE = `
Priority order for cinematic decisions:
1. Approved scientific content, provenance, uncertainty, and scientific visual-integrity constraints.
2. Explicit production constraints already approved in Tital.
3. The human director's project brief and any scoped director instruction.
4. Your own cinematic recommendation.

Never violate levels 1-2 to satisfy levels 3-4. If a director preference cannot be satisfied without overstating the science, choose a scientifically safe alternative rather than silently weakening the constraint.
`.trim();
