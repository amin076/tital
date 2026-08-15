import { FilmBriefSchema, type FilmBrief } from '../domain/filmBrief.js';
import { ResearchQuestionSchema, type ResearchQuestion } from '../domain/researchQuestion.js';
import { SourceRecordSchema, type SourceRecord } from '../domain/sourceRecord.js';
import { EvidenceRecordSchema, type EvidenceRecord } from '../domain/evidenceRecord.js';
import { ClaimRecordSchema, type ClaimRecord } from '../domain/claimRecord.js';
import { ScriptLineRecordSchema, type ScriptLineRecord } from '../domain/scriptLineRecord.js';
import { SceneRecordSchema, type SceneRecord } from '../domain/sceneRecord.js';
import { ShotRecordSchema, type ShotRecord } from '../domain/shotRecord.js';
import { VisualDecisionRecordSchema, type VisualDecisionRecord } from '../domain/visualDecisionRecord.js';
import { ProductionPackageSchema, type ProductionPackage } from '../domain/productionPackage.js';
import { runScientificAudit } from './runScientificAudit.js';

export interface ProductionPackageInput {
  filmBrief: FilmBrief;
  researchQuestions: ResearchQuestion[];
  sources: SourceRecord[];
  evidence: EvidenceRecord[];
  claims: ClaimRecord[];
  scriptLines: ScriptLineRecord[];
  scenes: SceneRecord[];
  shots: ShotRecord[];
  visualDecisions: VisualDecisionRecord[];
}

function allApproved<T extends { status: string }>(records: T[]): boolean {
  return records.length > 0 && records.every((record) => record.status === 'APPROVED' || record.status === 'LOCKED');
}

export function buildProductionPackage(
  input: ProductionPackageInput,
  options: { now?: () => string; auditIdFactory?: () => string } = {}
): ProductionPackage {
  FilmBriefSchema.parse(input.filmBrief);
  input.researchQuestions.forEach((record) => ResearchQuestionSchema.parse(record));
  input.sources.forEach((record) => SourceRecordSchema.parse(record));
  input.evidence.forEach((record) => EvidenceRecordSchema.parse(record));
  input.claims.forEach((record) => ClaimRecordSchema.parse(record));
  input.scriptLines.forEach((record) => ScriptLineRecordSchema.parse(record));
  input.scenes.forEach((record) => SceneRecordSchema.parse(record));
  input.shots.forEach((record) => ShotRecordSchema.parse(record));
  input.visualDecisions.forEach((record) => VisualDecisionRecordSchema.parse(record));

  const audit = runScientificAudit(
    {
      sources: input.sources,
      evidence: input.evidence,
      claims: input.claims,
      scriptLines: input.scriptLines,
      scenes: input.scenes,
      shots: input.shots,
      visualDecisions: input.visualDecisions,
    },
    { idFactory: options.auditIdFactory }
  );

  const workflowReady =
    (input.filmBrief.status === 'APPROVED' || input.filmBrief.status === 'LOCKED') &&
    allApproved(input.researchQuestions) &&
    allApproved(input.sources) &&
    allApproved(input.evidence) &&
    allApproved(input.claims) &&
    allApproved(input.scriptLines) &&
    allApproved(input.scenes) &&
    allApproved(input.shots) &&
    allApproved(input.visualDecisions);

  return ProductionPackageSchema.parse({
    ...input,
    audit,
    generatedAt: (options.now ?? (() => new Date().toISOString()))(),
    status: audit.passed && workflowReady ? 'READY_FOR_PRODUCTION' : 'BLOCKED',
  });
}
