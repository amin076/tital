import { z } from 'zod';

export const ResearchQuestionSchema = z.object({
  id: z.string().min(1, "ID must be a non-empty string"),
  filmBriefId: z.string().min(1, "FilmBrief ID must be a non-empty string"),
  question: z.string().min(1, "Question must be a non-empty string"),
  purpose: z.string().min(1, "Purpose must be a non-empty string"),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  status: z.enum(["REVIEW_REQUIRED", "APPROVED", "REJECTED"]),
});

export type ResearchQuestion = z.infer<typeof ResearchQuestionSchema>;

// Schema for Gemini's structured output (omitting ID, FilmBrief ID, and Status)
export const ModelOutputResearchQuestionSchema = ResearchQuestionSchema.omit({
  id: true,
  filmBriefId: true,
  status: true,
});

export type ModelOutputResearchQuestion = z.infer<typeof ModelOutputResearchQuestionSchema>;

// The container schema representing the array of research question proposals Gemini returns
export const ResearchQuestionsListSchema = z.object({
  questions: z.array(ModelOutputResearchQuestionSchema),
});

export type ResearchQuestionsList = z.infer<typeof ResearchQuestionsListSchema>;
