import { z } from 'zod';
import { FilmBriefSchema } from './filmBrief.js';
import { ResearchQuestionSchema } from './researchQuestion.js';
import { SourceRecordSchema } from './sourceRecord.js';
import { EvidenceRecordSchema } from './evidenceRecord.js';
import { ClaimRecordSchema } from './claimRecord.js';
import { ScriptLineRecordSchema } from './scriptLineRecord.js';
import { SceneRecordSchema } from './sceneRecord.js';
import { ShotRecordSchema } from './shotRecord.js';
import { VisualDecisionRecordSchema } from './visualDecisionRecord.js';
import { ScientificAuditReportSchema } from './scientificAudit.js';

export const MvpWorkflowStageSchema = z.enum([
  'DEFINE',
  'RESEARCH',
  'EVIDENCE',
  'CLAIMS',
  'SCRIPT',
  'SCENES',
  'SHOTS',
  'VISUAL_DECISIONS',
  'AUDIT',
  'PACKAGE',
  'COMPLETE',
]);

export const MvpWorkflowStateSchema = z.object({
  filmBrief: FilmBriefSchema,
  researchQuestions: z.array(ResearchQuestionSchema),
  sources: z.array(SourceRecordSchema),
  evidence: z.array(EvidenceRecordSchema),
  claims: z.array(ClaimRecordSchema),
  scriptLines: z.array(ScriptLineRecordSchema),
  scenes: z.array(SceneRecordSchema),
  shots: z.array(ShotRecordSchema),
  visualDecisions: z.array(VisualDecisionRecordSchema),
  audit: ScientificAuditReportSchema.nullable(),
});

export type MvpWorkflowStage = z.infer<typeof MvpWorkflowStageSchema>;
export type MvpWorkflowState = z.infer<typeof MvpWorkflowStateSchema>;
