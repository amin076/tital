import crypto from 'crypto';
import { type SourceRecord } from '../domain/sourceRecord.js';
import { type EvidenceRecord } from '../domain/evidenceRecord.js';
import { type ClaimRecord } from '../domain/claimRecord.js';
import { type ScriptLineRecord } from '../domain/scriptLineRecord.js';
import { type SceneRecord } from '../domain/sceneRecord.js';
import { type ShotRecord } from '../domain/shotRecord.js';
import { type VisualDecisionRecord } from '../domain/visualDecisionRecord.js';
import {
  ScientificAuditReportSchema,
  type ScientificAuditIssue,
  type ScientificAuditReport,
} from '../domain/scientificAudit.js';

export interface ScientificAuditInput {
  sources: SourceRecord[];
  evidence: EvidenceRecord[];
  claims: ClaimRecord[];
  scriptLines: ScriptLineRecord[];
  scenes: SceneRecord[];
  shots: ShotRecord[];
  visualDecisions: VisualDecisionRecord[];
}

export function runScientificAudit(
  input: ScientificAuditInput,
  options: { idFactory?: () => string } = {}
): ScientificAuditReport {
  const idFactory = options.idFactory ?? (() => `AUD-${crypto.randomUUID()}`);
  const issues: ScientificAuditIssue[] = [];
  const sourceById = new Map(input.sources.map((record) => [record.id, record]));
  const evidenceById = new Map(input.evidence.map((record) => [record.id, record]));
  const claimById = new Map(input.claims.map((record) => [record.id, record]));
  const scriptLineById = new Map(input.scriptLines.map((record) => [record.id, record]));
  const sceneById = new Map(input.scenes.map((record) => [record.id, record]));
  const shotById = new Map(input.shots.map((record) => [record.id, record]));

  const addIssue = (issue: Omit<ScientificAuditIssue, 'id'>): void => {
    issues.push({ id: idFactory(), ...issue });
  };

  for (const evidence of input.evidence) {
    const source = sourceById.get(evidence.sourceId);
    if (!source) {
      addIssue({
        code: 'BROKEN_PROVENANCE',
        severity: 'HIGH',
        recordType: 'EVIDENCE',
        recordId: evidence.id,
        message: `EvidenceRecord references missing SourceRecord "${evidence.sourceId}".`,
      });
      continue;
    }

    if (evidence.status === 'APPROVED' && source.status !== 'APPROVED') {
      addIssue({
        code: 'UNAPPROVED_UPSTREAM_RECORD',
        severity: 'HIGH',
        recordType: 'EVIDENCE',
        recordId: evidence.id,
        message: `Approved evidence depends on SourceRecord "${source.id}" with status "${source.status}".`,
      });
    }
  }

  for (const claim of input.claims) {
    for (const evidenceId of claim.evidenceIds) {
      const evidence = evidenceById.get(evidenceId);
      if (!evidence) {
        addIssue({
          code: 'UNSUPPORTED_CLAIM',
          severity: 'HIGH',
          recordType: 'CLAIM',
          recordId: claim.id,
          message: `Claim references missing EvidenceRecord "${evidenceId}".`,
        });
        continue;
      }

      if (claim.status === 'APPROVED' && evidence.status !== 'APPROVED') {
        addIssue({
          code: 'UNSUPPORTED_CLAIM',
          severity: 'HIGH',
          recordType: 'CLAIM',
          recordId: claim.id,
          message: `Approved claim depends on EvidenceRecord "${evidence.id}" with status "${evidence.status}".`,
        });
      }
    }
  }

  for (const scriptLine of input.scriptLines) {
    for (const claimId of scriptLine.claimIds) {
      const claim = claimById.get(claimId);
      if (!claim) {
        addIssue({
          code: 'BROKEN_PROVENANCE',
          severity: 'HIGH',
          recordType: 'SCRIPT_LINE',
          recordId: scriptLine.id,
          message: `ScriptLineRecord references missing ClaimRecord "${claimId}".`,
        });
      } else if (scriptLine.status === 'APPROVED' && claim.status !== 'APPROVED') {
        addIssue({
          code: 'UNAPPROVED_UPSTREAM_RECORD',
          severity: 'HIGH',
          recordType: 'SCRIPT_LINE',
          recordId: scriptLine.id,
          message: `Approved script line depends on ClaimRecord "${claim.id}" with status "${claim.status}".`,
        });
      }
    }
  }

  for (const scene of input.scenes) {
    for (const scriptLineId of scene.scriptLineIds) {
      const scriptLine = scriptLineById.get(scriptLineId);
      if (!scriptLine) {
        addIssue({
          code: 'BROKEN_PROVENANCE',
          severity: 'HIGH',
          recordType: 'SCENE',
          recordId: scene.id,
          message: `SceneRecord references missing ScriptLineRecord "${scriptLineId}".`,
        });
      } else if (scene.status === 'APPROVED' && scriptLine.status !== 'APPROVED') {
        addIssue({
          code: 'UNAPPROVED_UPSTREAM_RECORD',
          severity: 'HIGH',
          recordType: 'SCENE',
          recordId: scene.id,
          message: `Approved scene depends on ScriptLineRecord "${scriptLine.id}" with status "${scriptLine.status}".`,
        });
      }
    }
  }

  for (const shot of input.shots) {
    const scene = sceneById.get(shot.sceneId);
    if (!scene) {
      addIssue({
        code: 'BROKEN_PROVENANCE',
        severity: 'HIGH',
        recordType: 'SHOT',
        recordId: shot.id,
        message: `ShotRecord references missing SceneRecord "${shot.sceneId}".`,
      });
    } else if (shot.status === 'APPROVED' && scene.status !== 'APPROVED') {
      addIssue({
        code: 'UNAPPROVED_UPSTREAM_RECORD',
        severity: 'HIGH',
        recordType: 'SHOT',
        recordId: shot.id,
        message: `Approved shot depends on SceneRecord "${scene.id}" with status "${scene.status}".`,
      });
    }

    for (const scriptLineId of shot.scriptLineIds) {
      if (!scriptLineById.has(scriptLineId)) {
        addIssue({
          code: 'BROKEN_PROVENANCE',
          severity: 'HIGH',
          recordType: 'SHOT',
          recordId: shot.id,
          message: `ShotRecord references missing ScriptLineRecord "${scriptLineId}".`,
        });
      }
    }
  }

  for (const visualDecision of input.visualDecisions) {
    const shot = shotById.get(visualDecision.shotId);
    if (!shot) {
      addIssue({
        code: 'BROKEN_PROVENANCE',
        severity: 'HIGH',
        recordType: 'VISUAL_DECISION',
        recordId: visualDecision.id,
        message: `VisualDecisionRecord references missing ShotRecord "${visualDecision.shotId}".`,
      });
      continue;
    }

    if (visualDecision.status === 'APPROVED' && shot.status !== 'APPROVED') {
      addIssue({
        code: 'UNAPPROVED_UPSTREAM_RECORD',
        severity: 'HIGH',
        recordType: 'VISUAL_DECISION',
        recordId: visualDecision.id,
        message: `Approved visual decision depends on ShotRecord "${shot.id}" with status "${shot.status}".`,
      });
    }

    if (visualDecision.category !== shot.visualIntegrityCategory) {
      addIssue({
        code: 'VISUAL_CATEGORY_MISMATCH',
        severity: 'HIGH',
        recordType: 'VISUAL_DECISION',
        recordId: visualDecision.id,
        message: `Visual category "${visualDecision.category}" does not match approved shot category "${shot.visualIntegrityCategory}".`,
      });
    }

    if ((visualDecision.riskLevel === 'MEDIUM' || visualDecision.riskLevel === 'HIGH') && !visualDecision.disclosure) {
      addIssue({
        code: 'MISSING_VISUAL_DISCLOSURE',
        severity: visualDecision.riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM',
        recordType: 'VISUAL_DECISION',
        recordId: visualDecision.id,
        message: `${visualDecision.riskLevel}-risk visual decision requires an explicit disclosure.`,
      });
    }
  }

  return ScientificAuditReportSchema.parse({
    issues,
    passed: issues.length === 0,
  });
}
