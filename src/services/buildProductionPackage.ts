import { FilmBriefSchema, type FilmBrief } from '../domain/filmBrief.js';
import { ResearchQuestionSchema, type ResearchQuestion } from '../domain/researchQuestion.js';
import { SourceRecordSchema, type SourceRecord } from '../domain/sourceRecord.js';
import { EvidenceRecordSchema, type EvidenceRecord } from '../domain/evidenceRecord.js';
import { ClaimRecordSchema, type ClaimRecord } from '../domain/claimRecord.js';
import { ScriptLineRecordSchema, type ScriptLineRecord } from '../domain/scriptLineRecord.js';
import { SceneRecordSchema, type SceneRecord } from '../domain/sceneRecord.js';
import { ShotRecordSchema, type ShotRecord } from '../domain/shotRecord.js';
import { VisualDecisionRecordSchema, type VisualDecisionRecord } from '../domain/visualDecisionRecord.js';
import { CoverageWaiverSchema, type CoverageWaiver } from '../domain/coverageWaiver.js';
import { ProductionPackageSchema, type ProductionPackage } from '../domain/productionPackage.js';
import type { RuntimeAuditMetadata } from '../domain/runtimeAuditMetadata.js';
import type { MvpWorkflowState } from '../domain/mvpWorkflow.js';
import { runScientificAudit } from './runScientificAudit.js';
import { resolveRuntimeAuditMetadata } from './resolveRuntimeAuditMetadata.js';
import {
  isProductionWorkflowReady,
  selectApprovedProductionChain,
} from './mvpWorkflowGuards.js';

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
  coverageWaivers?: CoverageWaiver[];
}

export function buildProductionPackage(
  input: ProductionPackageInput,
  options: {
    now?: () => string;
    auditIdFactory?: () => string;
    runtimeAudit?: RuntimeAuditMetadata;
  } = {}
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
  (input.coverageWaivers ?? []).forEach((record) => CoverageWaiverSchema.parse(record));

  const workflowState: MvpWorkflowState = {
    ...input,
    coverageWaivers: input.coverageWaivers ?? [],
    audit: null,
  };
  const chain = selectApprovedProductionChain(workflowState);

  const audit = runScientificAudit(chain, { idFactory: options.auditIdFactory });
  const workflowReady = isProductionWorkflowReady(workflowState);

  return ProductionPackageSchema.parse({
    filmBrief: input.filmBrief,
    ...chain,
    coverageWaivers: input.coverageWaivers ?? [],
    audit,
    runtimeAudit: options.runtimeAudit ?? resolveRuntimeAuditMetadata(process.env, options.now),
    generatedAt: (options.now ?? (() => new Date().toISOString()))(),
    status: audit.passed && workflowReady ? 'READY_FOR_PRODUCTION' : 'BLOCKED',
  });
}
