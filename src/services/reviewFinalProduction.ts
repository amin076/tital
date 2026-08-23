import crypto from 'node:crypto';
import { InMemoryRunner } from '@google/adk';
import { productionReviewAgent } from '../agents/productionReviewAgent.js';
import { TITAL_GEMINI_MODEL } from '../config/models.js';
import { MvpSessionSchema, type MvpSession } from '../domain/mvpSession.js';
import type { ProductionPackage } from '../domain/productionPackage.js';
import {
  ProductionReviewProposalSchema,
  ProductionReviewReportSchema,
  type ProductionReviewProposal,
  type ProductionReviewReport,
  type ProductionReviewTargetType,
} from '../domain/productionReview.js';
import { collectAdkResponseText, toModelRuntimeError } from '../utils/adkModelResponse.js';
import { parseJsonFromModelResponse } from '../utils/modelJson.js';

export interface FinalProductionReviewRequest {
  productionPackage: ProductionPackage;
  directorBrief?: unknown;
}

export type FinalProductionReviewModelCaller = (
  request: FinalProductionReviewRequest
) => Promise<ProductionReviewProposal>;

export interface FinalProductionReviewOptions {
  modelCaller?: FinalProductionReviewModelCaller;
  reportIdFactory?: () => string;
  findingIdFactory?: () => string;
  eventIdFactory?: () => string;
  now?: () => string;
}

function numberMap(records: readonly { id: string }[]): Map<string, number> {
  return new Map(records.map((record, index) => [record.id, index + 1]));
}

function numbersFor(ids: readonly string[], mapping: Map<string, number>): number[] {
  return ids.flatMap((id) => {
    const number = mapping.get(id);
    return number === undefined ? [] : [number];
  });
}

/**
 * Converts trusted records into a compact semantic-review view. Trusted IDs are
 * deliberately replaced by 1-based record numbers before model invocation.
 */
export function modelSafeProductionContext(
  productionPackage: ProductionPackage,
  directorBrief?: unknown
): unknown {
  const pkg = productionPackage;
  const rqNumbers = numberMap(pkg.researchQuestions);
  const sourceNumbers = numberMap(pkg.sources);
  const evidenceNumbers = numberMap(pkg.evidence);
  const claimNumbers = numberMap(pkg.claims);
  const scriptNumbers = numberMap(pkg.scriptLines);
  const sceneNumbers = numberMap(pkg.scenes);
  const shotNumbers = numberMap(pkg.shots);

  return {
    filmBrief: {
      title: pkg.filmBrief.title,
      scientificTopic: pkg.filmBrief.scientificTopic,
      scientificQuestion: pkg.filmBrief.scientificQuestion,
      communicationObjective: pkg.filmBrief.communicationObjective,
      targetAudience: pkg.filmBrief.targetAudience,
      audienceKnowledgeLevel: pkg.filmBrief.audienceKnowledgeLevel,
      format: pkg.filmBrief.format,
      durationMinutes: pkg.filmBrief.durationMinutes,
      tone: pkg.filmBrief.tone,
      learningGoals: pkg.filmBrief.learningGoals,
      scope: pkg.filmBrief.scope,
      outOfScope: pkg.filmBrief.outOfScope,
      constraints: pkg.filmBrief.constraints,
    },
    directorBrief: directorBrief ?? null,
    deterministicAudit: {
      passed: pkg.audit.passed,
      issueCount: pkg.audit.issues.length,
    },
    researchQuestions: pkg.researchQuestions.map((record, index) => ({
      targetNumber: index + 1,
      question: record.question,
      purpose: record.purpose,
      priority: record.priority,
    })),
    sources: pkg.sources.map((record, index) => ({
      targetNumber: index + 1,
      researchQuestionNumber: rqNumbers.get(record.researchQuestionId) ?? null,
      title: record.title,
      url: record.url,
      publishDate: record.publishDate,
      excerpts: record.excerpts.slice(0, 3),
    })),
    evidence: pkg.evidence.map((record, index) => ({
      targetNumber: index + 1,
      researchQuestionNumber: rqNumbers.get(record.researchQuestionId) ?? null,
      sourceNumber: sourceNumbers.get(record.sourceId) ?? null,
      excerpt: record.excerpt,
      interpretation: record.interpretation,
      strength: record.strength,
      uncertainty: record.uncertainty,
    })),
    claims: pkg.claims.map((record, index) => ({
      targetNumber: index + 1,
      researchQuestionNumber: rqNumbers.get(record.researchQuestionId) ?? null,
      evidenceNumbers: numbersFor(record.evidenceIds, evidenceNumbers),
      text: record.text,
      confidence: record.confidence,
      uncertainty: record.uncertainty,
    })),
    scriptLines: pkg.scriptLines.map((record, index) => ({
      targetNumber: index + 1,
      researchQuestionNumber: rqNumbers.get(record.researchQuestionId) ?? null,
      claimNumbers: numbersFor(record.claimIds, claimNumbers),
      text: record.text,
      uncertaintyDisclosure: record.uncertaintyDisclosure,
    })),
    scenes: pkg.scenes.map((record, index) => ({
      targetNumber: index + 1,
      researchQuestionNumber: rqNumbers.get(record.researchQuestionId) ?? null,
      scriptLineNumbers: numbersFor(record.scriptLineIds, scriptNumbers),
      title: record.title,
      purpose: record.purpose,
      visualSummary: record.visualSummary,
      uncertaintyDisclosure: record.uncertaintyDisclosure,
    })),
    shots: pkg.shots.map((record, index) => ({
      targetNumber: index + 1,
      researchQuestionNumber: rqNumbers.get(record.researchQuestionId) ?? null,
      sceneNumber: sceneNumbers.get(record.sceneId) ?? null,
      scriptLineNumbers: numbersFor(record.scriptLineIds, scriptNumbers),
      description: record.description,
      cameraDirection: record.cameraDirection,
      visualIntegrityCategory: record.visualIntegrityCategory,
      scientificConstraint: record.scientificConstraint,
      uncertaintyDisclosure: record.uncertaintyDisclosure,
    })),
    visualDecisions: pkg.visualDecisions.map((record, index) => ({
      targetNumber: index + 1,
      researchQuestionNumber: rqNumbers.get(record.researchQuestionId) ?? null,
      shotNumber: shotNumbers.get(record.shotId) ?? null,
      category: record.category,
      decision: record.decision,
      scientificConstraint: record.scientificConstraint,
      disclosure: record.disclosure,
      riskLevel: record.riskLevel,
    })),
  };
}

export function parseProductionReviewProposal(rawText: string): ProductionReviewProposal {
  const payload = parseJsonFromModelResponse(rawText, 'Production review agent');
  const parsed = ProductionReviewProposalSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Production review validation failed: ${parsed.error.message}`);
  }
  return parsed.data;
}

export async function callProductionReviewAgent(
  request: FinalProductionReviewRequest
): Promise<ProductionReviewProposal> {
  const runner = new InMemoryRunner({ agent: productionReviewAgent });
  let responseText = '';
  try {
    const run = runner.runEphemeral({
      userId: 'system',
      newMessage: {
        parts: [{
          text: `Review this completed production package. This is an advisory semantic review, not a scientific-truth certification. Use only the supplied numbered context.\n\n${JSON.stringify(modelSafeProductionContext(request.productionPackage, request.directorBrief), null, 2)}`,
        }],
      },
    });
    responseText = await collectAdkResponseText(run, { label: 'Production review agent' });
  } catch (error) {
    throw toModelRuntimeError('Production review agent', error);
  }
  return parseProductionReviewProposal(responseText);
}

function recordsForTarget(
  pkg: ProductionPackage,
  targetType: ProductionReviewTargetType
): readonly { id: string }[] {
  if (targetType === 'SourceRecord') return pkg.sources;
  if (targetType === 'EvidenceRecord') return pkg.evidence;
  if (targetType === 'ClaimRecord') return pkg.claims;
  if (targetType === 'ScriptLineRecord') return pkg.scriptLines;
  if (targetType === 'SceneRecord') return pkg.scenes;
  if (targetType === 'ShotRecord') return pkg.shots;
  if (targetType === 'VisualDecisionRecord') return pkg.visualDecisions;
  return [];
}

export function assembleProductionReviewReport(
  pkg: ProductionPackage,
  proposal: ProductionReviewProposal,
  options: Pick<FinalProductionReviewOptions, 'reportIdFactory' | 'findingIdFactory' | 'now'> = {}
): ProductionReviewReport {
  const validated = ProductionReviewProposalSchema.parse(proposal);
  const now = options.now ?? (() => new Date().toISOString());
  const createdAt = now();
  const reportIdFactory = options.reportIdFactory ?? (() => `PRV-${crypto.randomUUID()}`);
  const findingIdFactory = options.findingIdFactory ?? (() => `PRF-${crypto.randomUUID()}`);

  const findings = validated.findings.map((finding) => {
    let targetRecordId: string | null = null;
    if (finding.targetType === 'PROJECT') {
      if (finding.targetNumber !== null) {
        throw new Error('PROJECT production-review findings must use targetNumber null.');
      }
    } else {
      if (finding.targetNumber === null) {
        throw new Error(`${finding.targetType} production-review finding requires targetNumber.`);
      }
      const target = recordsForTarget(pkg, finding.targetType)[finding.targetNumber - 1];
      if (!target) {
        throw new Error(
          `Production review finding references ${finding.targetType} number outside the supplied package: ${finding.targetNumber}.`
        );
      }
      targetRecordId = target.id;
    }

    const { targetNumber: _targetNumber, ...safeFinding } = finding;
    return {
      ...safeFinding,
      id: findingIdFactory(),
      targetRecordId,
    };
  });

  return ProductionReviewReportSchema.parse({
    id: reportIdFactory(),
    productionPackageGeneratedAt: pkg.generatedAt,
    createdAt,
    model: TITAL_GEMINI_MODEL,
    summary: validated.summary,
    overallRisk: validated.overallRisk,
    findings,
    advisoryOnly: true,
  });
}

/**
 * Runs an advisory semantic review over the current READY_FOR_PRODUCTION package.
 * No workflow record, approval, audit, or package content is mutated.
 */
export async function reviewFinalProduction(
  session: MvpSession,
  options: FinalProductionReviewOptions = {}
): Promise<MvpSession> {
  const validated = MvpSessionSchema.parse(session);
  const pkg = validated.productionPackage;
  if (!pkg || pkg.status !== 'READY_FOR_PRODUCTION' || !pkg.audit.passed) {
    throw new Error('Final production AI review requires a READY_FOR_PRODUCTION package with a passing deterministic audit.');
  }

  const proposal = await (options.modelCaller ?? callProductionReviewAgent)({
    productionPackage: pkg,
    directorBrief: validated.projectInput?.directorBrief,
  });
  const report = assembleProductionReviewReport(pkg, proposal, options);
  const eventId = (options.eventIdFactory ?? (() => `EVT-${crypto.randomUUID()}`))();

  return MvpSessionSchema.parse({
    ...validated,
    updatedAt: report.createdAt,
    productionReviews: [...(validated.productionReviews ?? []), report].slice(-20),
    events: [
      ...validated.events,
      {
        id: eventId,
        type: 'PRODUCTION_REVIEWED',
        at: report.createdAt,
        stage: 'COMPLETE',
        message: `Advisory final-production review completed with ${report.findings.length} finding(s) and ${report.overallRisk.toLowerCase()} overall risk. Human authority and trusted production state were unchanged.`,
      },
    ],
  });
}
