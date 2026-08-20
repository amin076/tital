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
import { CoverageWaiverSchema } from './coverageWaiver.js';
import { ScientificAuditReportSchema } from './scientificAudit.js';

export const ProductionPackageSchema = z.object({
  filmBrief: FilmBriefSchema,
  researchQuestions: z.array(ResearchQuestionSchema).min(1),
  sources: z.array(SourceRecordSchema),
  evidence: z.array(EvidenceRecordSchema),
  claims: z.array(ClaimRecordSchema),
  scriptLines: z.array(ScriptLineRecordSchema),
  scenes: z.array(SceneRecordSchema),
  shots: z.array(ShotRecordSchema),
  visualDecisions: z.array(VisualDecisionRecordSchema),
  coverageWaivers: z.array(CoverageWaiverSchema).optional(),
  audit: ScientificAuditReportSchema,
  generatedAt: z.string().min(1),
  status: z.enum(['BLOCKED', 'READY_FOR_PRODUCTION']),
});

export type ProductionPackage = z.infer<typeof ProductionPackageSchema>;
