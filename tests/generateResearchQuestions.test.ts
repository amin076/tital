import { describe, it, expect } from 'vitest';
import { type FilmBrief } from '../src/domain/filmBrief.js';
import {
  generateResearchQuestions,
  assembleResearchQuestions,
} from '../src/services/generateResearchQuestions.js';
import { type ResearchQuestionsList } from '../src/domain/researchQuestion.js';

describe('Research Questions Service - Deterministic Unit Tests', () => {
  const mockApprovedBrief: FilmBrief = {
    id: "FB-europa-approved",
    title: "Europa's Oceans",
    scientificTopic: "Planetary Astrobiology",
    scientificQuestion: "Does Europa have life in its subsurface oceans?",
    communicationObjective: "Show gravity anomalies.",
    targetAudience: "High School Students",
    audienceKnowledgeLevel: "Beginner",
    format: "Documentary",
    durationMinutes: 8,
    tone: "Analytical",
    learningGoals: ["Goal 1"],
    scope: ["Scope 1"],
    outOfScope: ["Out 1"],
    constraints: ["Constraint 1"],
    researchRequirements: ["Req 1"],
    status: "APPROVED",
  };

  const dummyModelProposals: ResearchQuestionsList = {
    questions: [
      {
        question: "What is the salinity of the subsurface ocean on Europa?",
        purpose: "Salinity affects the electrical conductivity, which Galileo magnetometer measured.",
        priority: "HIGH",
      },
      {
        question: "What mechanisms cause the surface cracks in Europa's ice shell?",
        purpose: "Shows active geological pressure from subsurface ocean movements.",
        priority: "MEDIUM",
      },
    ],
  };

  it('1. should allow a valid APPROVED FilmBrief to proceed', async () => {
    const mockModelCaller = async (brief: FilmBrief) => dummyModelProposals;
    const questions = await generateResearchQuestions(mockApprovedBrief, mockModelCaller);

    expect(questions.length).toBe(2);
    expect(questions[0].question).toContain("salinity");
  });

  it('2. should reject a REVIEW_REQUIRED FilmBrief before model invocation', async () => {
    const reviewRequiredBrief = { ...mockApprovedBrief, status: "REVIEW_REQUIRED" as const };
    const mockModelCaller = async (brief: FilmBrief) => dummyModelProposals;

    await expect(generateResearchQuestions(reviewRequiredBrief, mockModelCaller)).rejects.toThrow("FilmBrief is not approved");
  });

  it('3. should reject a DRAFT FilmBrief', async () => {
    const draftBrief = { ...mockApprovedBrief, status: "DRAFT" as const };
    const mockModelCaller = async (brief: FilmBrief) => dummyModelProposals;

    await expect(generateResearchQuestions(draftBrief, mockModelCaller)).rejects.toThrow("FilmBrief is not approved");
  });

  it('4. should turn valid model proposals into valid ResearchQuestions', async () => {
    const mockModelCaller = async (brief: FilmBrief) => dummyModelProposals;
    const questions = await generateResearchQuestions(mockApprovedBrief, mockModelCaller);

    expect(questions[0].question).toBe(dummyModelProposals.questions[0].question);
    expect(questions[0].purpose).toBe(dummyModelProposals.questions[0].purpose);
  });

  it('5. should generate application-managed IDs with prefix RQ-', async () => {
    const mockModelCaller = async (brief: FilmBrief) => dummyModelProposals;
    const questions = await generateResearchQuestions(mockApprovedBrief, mockModelCaller);

    expect(questions[0].id).toBeDefined();
    expect(questions[0].id.startsWith("RQ-")).toBe(true);
    expect(questions[0].id.length).toBeGreaterThan(10);
  });

  it('6. should ensure filmBriefId always matches the input FilmBrief ID', async () => {
    const mockModelCaller = async (brief: FilmBrief) => dummyModelProposals;
    const questions = await generateResearchQuestions(mockApprovedBrief, mockModelCaller);

    expect(questions[0].filmBriefId).toBe("FB-europa-approved");
    expect(questions[1].filmBriefId).toBe("FB-europa-approved");
  });

  it('7. should always force status of research questions to REVIEW_REQUIRED', async () => {
    const mockModelCaller = async (brief: FilmBrief) => dummyModelProposals;
    const questions = await generateResearchQuestions(mockApprovedBrief, mockModelCaller);

    expect(questions[0].status).toBe("REVIEW_REQUIRED");
    expect(questions[1].status).toBe("REVIEW_REQUIRED");
  });

  it('8. should prevent the model from overriding ID, FilmBrief ID, or status', async () => {
    const intrusiveProposals = {
      questions: [
        {
          ...dummyModelProposals.questions[0],
          id: "RQ-INTRUSIVE-OVERRIDE",
          filmBriefId: "FB-INTRUSIVE-OVERRIDE",
          status: "APPROVED" as any,
        },
      ],
    };

    const questions = assembleResearchQuestions(intrusiveProposals as any, "FB-safe-id");
    expect(questions[0].id).not.toBe("RQ-INTRUSIVE-OVERRIDE");
    expect(questions[0].filmBriefId).toBe("FB-safe-id");
    expect(questions[0].status).toBe("REVIEW_REQUIRED");
  });

  it('9. should reject empty research questions', async () => {
    const emptyQuestionProposals = {
      questions: [
        {
          question: "",
          purpose: "Purpose of empty question.",
          priority: "HIGH" as const,
        },
      ],
    };

    const mockModelCaller = async (brief: FilmBrief) => emptyQuestionProposals as any;
    await expect(generateResearchQuestions(mockApprovedBrief, mockModelCaller)).rejects.toThrow("Model output fails research questions list schema");
  });

  it('10. should reject invalid priority values', async () => {
    const invalidPriorityProposals = {
      questions: [
        {
          question: "Valid Question?",
          purpose: "Valid Purpose.",
          priority: "URGENT" as any,
        },
      ],
    };

    const mockModelCaller = async (brief: FilmBrief) => invalidPriorityProposals as any;
    await expect(generateResearchQuestions(mockApprovedBrief, mockModelCaller)).rejects.toThrow("Model output fails research questions list schema");
  });
});
