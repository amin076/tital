import { describe, it, expect } from 'vitest';
import { defineFilm, assembleFilmBrief } from '../src/services/defineFilm.js';
import { type ModelOutputBrief } from '../src/domain/filmBrief.js';

describe('Define Film Service - Deterministic Unit Tests', () => {
  const dummyModelOutput: ModelOutputBrief = {
    title: "Europa Subsurface Oceans",
    scientificTopic: "Astrobiology / Planetary Science",
    scientificQuestion: "Does Europa sustain a liquid water ocean beneath its icy shell?",
    communicationObjective: "Explain the tidal heating mechanism and evidence from Galileo probe.",
    targetAudience: "High School Students",
    audienceKnowledgeLevel: "Beginner",
    format: "Documentary Short",
    durationMinutes: 8,
    tone: "Analytical & Educational",
    learningGoals: ["Understand tidal heating", "Analyze magnetic field disturbances"],
    scope: ["Tidal heating explanation", "Galileo magnetometer findings"],
    outOfScope: ["Deep mathematical modeling of tidal forces"],
    constraints: ["Visuals restricted to animated diagrams of Europa's interior"],
    researchRequirements: ["Review NASA jet propulsion lab articles on Europa"],
  };

  it('1. should reject empty input before model invocation', async () => {
    await expect(defineFilm("")).rejects.toThrow("Empty film idea");
  });

  it('2. should reject whitespace-only input', async () => {
    await expect(defineFilm("   ")).rejects.toThrow("Empty film idea");
  });

  it('3. should turn valid model-produced data into a valid FilmBrief', async () => {
    const mockModelCaller = async (idea: string) => dummyModelOutput;
    const brief = await defineFilm("Europa", mockModelCaller);

    expect(brief.title).toBe(dummyModelOutput.title);
    expect(brief.durationMinutes).toBe(8);
  });

  it('4. should generate a non-empty ID prefixed with FB-', async () => {
    const mockModelCaller = async (idea: string) => dummyModelOutput;
    const brief = await defineFilm("Europa", mockModelCaller);

    expect(brief.id).toBeDefined();
    expect(brief.id.startsWith("FB-")).toBe(true);
    expect(brief.id.length).toBeGreaterThan(10);
  });

  it('5. should ensure the generated ID is not supplied by the model', async () => {
    const mockModelCaller = async (idea: string) => dummyModelOutput;
    const brief = await defineFilm("Europa", mockModelCaller);

    // Ensure model output has no ID field at all (checked by TS types, but we double-check)
    expect((dummyModelOutput as any).id).toBeUndefined();
    expect(brief.id).toBeDefined();
  });

  it('6. should always force status to REVIEW_REQUIRED', async () => {
    const mockModelCaller = async (idea: string) => dummyModelOutput;
    const brief = await defineFilm("Europa", mockModelCaller);

    expect(brief.status).toBe("REVIEW_REQUIRED");
  });

  it('7. should not allow the model to force status to APPROVED or LOCKED', async () => {
    // Even if model output contains status or id properties dynamically injected as dynamic keys,
    // assembleFilmBrief overwrites them or strips them as per Zod parsing constraints.
    const intrusiveModelOutput = {
      ...dummyModelOutput,
      status: "APPROVED" as any,
      id: "FB-MODEL-OVERRIDE",
    };

    const brief = assembleFilmBrief(intrusiveModelOutput as any);
    expect(brief.status).toBe("REVIEW_REQUIRED");
    expect(brief.id).not.toBe("FB-MODEL-OVERRIDE");
  });

  it('8. should reject invalid model-produced data', async () => {
    const invalidModelOutput = {
      ...dummyModelOutput,
      title: "", // should fail min(1) title validation
    };

    const mockModelCaller = async (idea: string) => invalidModelOutput as any;
    await expect(defineFilm("Europa", mockModelCaller)).rejects.toThrow("fails the model-output schema");
  });

  it('9. should reject invalid duration Minutes <= 0', async () => {
    const invalidDurationOutput = {
      ...dummyModelOutput,
      durationMinutes: -1, // should fail positive validation
    };

    const mockModelCaller = async (idea: string) => invalidDurationOutput as any;
    await expect(defineFilm("Europa", mockModelCaller)).rejects.toThrow("fails the model-output schema");
  });
});
