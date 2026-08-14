import { z } from 'zod';

export const FilmBriefSchema = z.object({
  id: z.string().min(1, "ID must be a non-empty string"),
  title: z.string().min(1, "Title must be a non-empty string"),
  scientificTopic: z.string().min(1, "Scientific topic must be a non-empty string"),
  scientificQuestion: z.string().min(1, "Scientific question must be a non-empty string"),
  communicationObjective: z.string().min(1, "Communication objective must be a non-empty string"),
  targetAudience: z.string().min(1, "Target audience must be a non-empty string"),
  audienceKnowledgeLevel: z.string().min(1, "Audience knowledge level must be a non-empty string"),
  format: z.string().min(1, "Format must be a non-empty string"),
  durationMinutes: z.number().positive("Duration must be a positive number"),
  tone: z.string().min(1, "Tone must be a non-empty string"),
  learningGoals: z.array(z.string().min(1, "Learning goal must be a non-empty string")),
  scope: z.array(z.string().min(1, "Scope item must be a non-empty string")),
  outOfScope: z.array(z.string().min(1, "Out-of-scope item must be a non-empty string")),
  constraints: z.array(z.string().min(1, "Constraint must be a non-empty string")),
  researchRequirements: z.array(z.string().min(1, "Research requirement must be a non-empty string")),
  status: z.enum(["DRAFT", "REVIEW_REQUIRED", "APPROVED", "LOCKED"]),
});

export type FilmBrief = z.infer<typeof FilmBriefSchema>;
