import { describe, it, expect } from 'vitest';
import { FilmBriefSchema, type FilmBrief } from '../src/domain/filmBrief.js';

describe('FilmBrief Schema & Type Validation', () => {
  const validBriefData = {
    id: "FB-001",
    title: "The Mystery of Gravity",
    scientificTopic: "Quantum Gravity",
    scientificQuestion: "Does gravity exhibit quantum behaviors at microscopic scales?",
    communicationObjective: "Demonstrate quantum superposition in visual models.",
    targetAudience: "General Public / High School Physics Students",
    audienceKnowledgeLevel: "Beginner",
    format: "Documentary Short",
    durationMinutes: 12.5,
    tone: "Inspirational & Analytical",
    learningGoals: ["Understand classical gravity limits", "Visualize spacetime curvature"],
    scope: ["General relativity overview", "Quantum mechanical foundations"],
    outOfScope: ["String theory mathematical derivations"],
    constraints: ["Budget limited to standard animation models", "Maximum length of 15 minutes"],
    researchRequirements: ["Consult with experimental physicists", "Reference peer-reviewed articles"],
    status: "DRAFT" as const,
  };

  it('1. should pass validation with valid FilmBrief data', () => {
    const result = FilmBriefSchema.safeParse(validBriefData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validBriefData);
    }
  });

  it('2. should fail validation when durationMinutes <= 0', () => {
    const zeroDuration = { ...validBriefData, durationMinutes: 0 };
    const negativeDuration = { ...validBriefData, durationMinutes: -5 };

    expect(FilmBriefSchema.safeParse(zeroDuration).success).toBe(false);
    expect(FilmBriefSchema.safeParse(negativeDuration).success).toBe(false);
  });

  it('3. should fail validation when an invalid status is provided', () => {
    const invalidStatus = { ...validBriefData, status: "INVALID_STATUS" as any };
    const result = FilmBriefSchema.safeParse(invalidStatus);
    expect(result.success).toBe(false);
  });

  it('4. should fail validation when a required string field is empty', () => {
    const emptyTitle = { ...validBriefData, title: "" };
    const result = FilmBriefSchema.safeParse(emptyTitle);
    expect(result.success).toBe(false);
  });

  it('7. should fail validation when id is an empty string', () => {
    const emptyId = { ...validBriefData, id: "" };
    const result = FilmBriefSchema.safeParse(emptyId);
    expect(result.success).toBe(false);
  });

  it('5. should fail validation when element types inside arrays are invalid', () => {
    const invalidArrayElements = {
      ...validBriefData,
      learningGoals: [123, "Valid Goal"] as any[],
    };
    const result = FilmBriefSchema.safeParse(invalidArrayElements);
    expect(result.success).toBe(false);

    const emptyArrayElement = {
      ...validBriefData,
      scope: ["", "Valid Scope"] as string[],
    };
    const result2 = FilmBriefSchema.safeParse(emptyArrayElement);
    expect(result2.success).toBe(false);
  });

  it('6. should preserve expected values on successful parse', () => {
    const result = FilmBriefSchema.safeParse(validBriefData);
    expect(result.success).toBe(true);
    if (result.success) {
      const parsed: FilmBrief = result.data;
      expect(parsed.id).toBe("FB-001");
      expect(parsed.durationMinutes).toBe(12.5);
      expect(parsed.status).toBe("DRAFT");
      expect(parsed.learningGoals).toContain("Visualize spacetime curvature");
    }
  });
});
