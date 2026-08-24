import { getIdToken, loadPublicRuntimeConfig, type PublicRuntimeConfig } from './auth';

export interface DirectorBriefInput {
  collaborationMode: 'AI_ASSISTED' | 'COLLABORATIVE' | 'DIRECTOR_LED';
  pacing: 'CONTEMPLATIVE' | 'BALANCED' | 'ENERGETIC';
  cameraMovement: 'RESTRAINED' | 'BALANCED' | 'EXPRESSIVE';
  representationPreference:
    | 'REAL_IMAGERY_FIRST'
    | 'BALANCED'
    | 'EXPLANATORY_VISUALS_FIRST';
  visualStyle?: string;
  notes?: string;
  avoid: string[];
}

export interface CreateSessionInput {
  rawIdea: string;
  title?: string;
  durationMinutes?: number;
  targetAudience?: string;
  audienceKnowledgeLevel?: string;
  format?: string;
  tone?: string;
  directorBrief?: DirectorBriefInput;
}

export interface SessionSummary {
  sessionId: string;
  title: string;
  stage: string;
  nextAction: string;
  blockedBy: string[];
  updatedAt: string;
  productionPackageStatus: string | null;
  counts: Record<string, Record<string, number>>;
}

export interface GateRecord {
  id: string;
  status: string;
  [key: string]: unknown;
}

export interface ReviewCoverageGroup {
  targetType: 'WORKFLOW' | 'RESEARCH_QUESTION' | 'SCENE' | 'SHOT';
  targetId: string;
  targetLabel: string;
  pendingRecordIds: string[];
  approvedRecordCount: number;
  canRetry: boolean;
  canWaive: boolean;
}

export interface ReviewGate {
  stage: string;
  recordType: string;
  records: GateRecord[];
  canApprove: boolean;
  canReject: boolean;
  coverageGroups: ReviewCoverageGroup[];
}

export interface ReviewRecommendation {
  id: string;
  targetType:
    | 'FILM_BRIEF'
    | 'RESEARCH_QUESTION'
    | 'SOURCE'
    | 'EVIDENCE'
    | 'CLAIM'
    | 'SCRIPT'
    | 'SCENE'
    | 'SHOT'
    | 'VISUAL';
  targetRecordId: string;
  recommendation: 'APPROVE_SUGGESTED' | 'REJECT_SUGGESTED' | 'REVIEW_REQUIRED';
  attention: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  reasons: string[];
  risks: string[];
  flags: string[];
  createdAt: string;
  model: string;
}

export type RevisionType =
  | 'PROJECT_DURATION_CHANGE'
  | 'SOURCE_APPROVAL_REVOKE'
  | 'CLAIM_REVISION'
  | 'SCRIPT_REVISION'
  | 'SCENE_REVISION'
  | 'SHOT_REVISION'
  | 'VISUAL_REVISION';

export type RevisionTargetType =
  | 'PROJECT'
  | 'SourceRecord'
  | 'ClaimRecord'
  | 'ScriptLineRecord'
  | 'SceneRecord'
  | 'ShotRecord'
  | 'VisualDecisionRecord';

export interface RevisionDraft {
  type: RevisionType;
  targetType: RevisionTargetType;
  targetRecordId: string | null;
  reason: string;
  instruction?: string;
  proposedDurationMinutes?: number;
}

export interface RevisionRequest extends RevisionDraft {
  id: string;
  requestedBy: string;
  createdAt: string;
  status: 'REQUESTED' | 'APPLIED' | 'REPAIRING' | 'COMPLETED' | 'CANCELLED';
}

export interface RevisionImpactCounts {
  researchQuestions: number;
  sources: number;
  evidence: number;
  claims: number;
  scriptLines: number;
  scenes: number;
  shots: number;
  visualDecisions: number;
}

export interface RevisionImpact {
  revisionId: string;
  type: RevisionType;
  targetType: RevisionTargetType;
  targetRecordId: string | null;
  affectedRecordIds: string[];
  counts: RevisionImpactCounts;
  invalidatesAudit: boolean;
  invalidatesProductionPackage: boolean;
  preservedLayers: string[];
  affectedLayers: string[];
  summary: string;
}

export interface RevisionPreview {
  revision: RevisionRequest;
  impact: RevisionImpact;
}

export interface CoverageWaiver {
  id: string;
  stage: string;
  targetType: 'RESEARCH_QUESTION' | 'SCENE' | 'SHOT';
  targetId: string;
  reason: string;
  rejectedRecordIds: string[];
  createdAt: string;
}

export interface ContinueAction {
  enabled: boolean;
  mode:
    | 'LIVE_RUNTIME'
    | 'DETERMINISTIC'
    | 'BLOCKED_BY_REVIEW'
    | 'BLOCKED_BY_AUDIT'
    | 'BLOCKED'
    | 'COMPLETE';
  message: string;
}

export interface SessionPerformanceOperation {
  name: string;
  targetId: string | null;
  durationMs: number;
  success: boolean;
  kind?: 'EXTERNAL' | 'INTERNAL';
  runtime?: RuntimeAuditMetadata;
  failure?: RuntimeFailureMetadata;
}

export interface RuntimeAuditMetadata {
  provider: string;
  backend: string;
  modelIdentifier: string;
  agentFramework: string;
  modelPlatform: string;
  cloudRunRevision: string | null;
  cloudRunService: string | null;
  releaseSha: string | null;
  executionTimestamp: string;
}

export interface RuntimeFailureMetadata {
  category: string;
  errorCode?: string | null;
  finishReason?: string | null;
  eventCount?: number;
  detail?: string;
}

export interface SessionEvent {
  id: string;
  type: string;
  at: string;
  stage: string;
  message: string;
  performance?: {
    durationMs: number;
    externalCallCount: number;
    concurrencyLimit?: number;
    operations: SessionPerformanceOperation[];
  };
}

export interface DirectorFeedback {
  id: string;
  instruction: string;
  capturedAt: string;
  stage: string;
  rejectedRecordIds: string[];
}

export interface PerformanceStageInsight {
  stage: string;
  executions: number;
  durationMs: number;
  externalCallCount: number;
  externalWorkMs: number;
  internalWorkMs: number;
  averageCallMs: number;
  slowestCallMs: number;
  slowestOperationName: string | null;
  slowestTargetId: string | null;
  parallelOverlapFactor: number | null;
  failedCallCount: number;
}

export interface PerformanceInsights {
  measured: boolean;
  measuredExecutionCount: number;
  measuredStageCount: number;
  includesProjectCreation: boolean;
  concurrencyLimits: number[];
  durationMs: number;
  externalCallCount: number;
  externalWorkMs: number;
  internalWorkMs: number;
  averageCallMs: number;
  slowestCallMs: number;
  slowestOperationName: string | null;
  slowestTargetId: string | null;
  slowestStage: string | null;
  parallelOverlapFactor: number | null;
  failedCallCount: number;
  runtime: RuntimeAuditMetadata | null;
  latestFailure: RuntimeFailureMetadata | null;
  stages: PerformanceStageInsight[];
}

export interface WorkflowStepInsight {
  stage: string;
  label: string;
  status: 'COMPLETE' | 'CURRENT' | 'UPCOMING';
}

export interface CoverageInsight {
  key: string;
  label: string;
  parentLabel: string;
  childLabel: string;
  covered: number;
  waived: number;
  total: number;
  complete: boolean;
  missingParentIds: string[];
  waivedParentIds: string[];
}

export interface WorkflowInsights {
  stage: string;
  blockedBy: string[];
  steps: WorkflowStepInsight[];
  coverage: CoverageInsight[];
}

export interface ApprovedChain {
  researchQuestions: GateRecord[];
  sources: GateRecord[];
  evidence: GateRecord[];
  claims: GateRecord[];
  scriptLines: GateRecord[];
  scenes: GateRecord[];
  shots: GateRecord[];
  visualDecisions: GateRecord[];
}

export interface ScientificAudit {
  passed: boolean;
  issues: Array<{
    id: string;
    code: string;
    severity: string;
    recordType: string;
    recordId: string;
    message: string;
  }>;
}

export interface ProductionPackage {
  filmBrief: GateRecord;
  researchQuestions: GateRecord[];
  sources: GateRecord[];
  evidence: GateRecord[];
  claims: GateRecord[];
  scriptLines: GateRecord[];
  scenes: GateRecord[];
  shots: GateRecord[];
  visualDecisions: GateRecord[];
  coverageWaivers?: CoverageWaiver[];
  audit: ScientificAudit;
  runtimeAudit?: RuntimeAuditMetadata;
  generatedAt: string;
  status: 'BLOCKED' | 'READY_FOR_PRODUCTION';
}

export interface SessionView {
  summary: SessionSummary;
  rawIdea: string;
  projectInput: CreateSessionInput;
  directorFeedback: DirectorFeedback[];
  reviewRecommendations: ReviewRecommendation[];
  revisionRequests: RevisionRequest[];
  gate: ReviewGate | null;
  continueAction: ContinueAction;
  workflowInsights: WorkflowInsights;
  performanceInsights: PerformanceInsights;
  approvedChain: ApprovedChain;
  coverageWaivers: CoverageWaiver[];
  audit: ScientificAudit | null;
  productionPackage: ProductionPackage | null;
  recentEvents: SessionEvent[];
}

interface ApiErrorBody {
  error?: string;
  code?: string;
  gaps?: ReviewCoverageGroup[];
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly gaps?: ReviewCoverageGroup[]
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  authenticated = true
): Promise<T> {
  const token = authenticated ? await getIdToken() : null;
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  const body = (await response.json()) as T & ApiErrorBody;

  if (!response.ok) {
    throw new ApiError(
      body.error || `Request failed with status ${response.status}.`,
      response.status,
      body.code,
      body.gaps
    );
  }

  return body;
}

export function getPublicConfig(): Promise<PublicRuntimeConfig> {
  return loadPublicRuntimeConfig();
}

export function getPublicDemo(): Promise<SessionView> {
  return request<SessionView>('/api/public/demo', {}, false);
}

export function listSessions(): Promise<SessionSummary[]> {
  return request<SessionSummary[]>('/api/sessions');
}

export function createSession(input: string | CreateSessionInput): Promise<SessionView> {
  const projectInput = typeof input === 'string' ? { rawIdea: input } : input;
  return request<SessionView>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify(projectInput),
  });
}

export function getSession(sessionId: string): Promise<SessionView> {
  return request<SessionView>(
    `/api/sessions/${encodeURIComponent(sessionId)}`
  );
}

export function reviewSession(
  sessionId: string,
  decision: 'APPROVE' | 'REJECT',
  recordIds: string[],
  options: {
    gapResolution?: 'RETRY' | 'WAIVE';
    reason?: string;
    rememberInstruction?: boolean;
  } = {}
): Promise<SessionView> {
  return request<SessionView>(
    `/api/sessions/${encodeURIComponent(sessionId)}/review`,
    {
      method: 'POST',
      body: JSON.stringify({
        decision,
        recordIds,
        gapResolution: options.gapResolution,
        reason: options.reason,
        rememberInstruction: options.rememberInstruction,
      }),
    }
  );
}

export function assistReview(sessionId: string): Promise<SessionView> {
  return request<SessionView>(
    `/api/sessions/${encodeURIComponent(sessionId)}/review-assist`,
    { method: 'POST' }
  );
}

export function previewRevision(
  sessionId: string,
  draft: RevisionDraft
): Promise<RevisionPreview> {
  return request<RevisionPreview>(
    `/api/sessions/${encodeURIComponent(sessionId)}/revisions/preview`,
    { method: 'POST', body: JSON.stringify(draft) }
  );
}

export function applyRevision(
  sessionId: string,
  preview: RevisionPreview
): Promise<SessionView> {
  const { revision } = preview;
  return request<SessionView>(
    `/api/sessions/${encodeURIComponent(sessionId)}/revisions/apply`,
    {
      method: 'POST',
      body: JSON.stringify({
        id: revision.id,
        type: revision.type,
        targetType: revision.targetType,
        targetRecordId: revision.targetRecordId,
        reason: revision.reason,
        instruction: revision.instruction,
        proposedDurationMinutes: revision.proposedDurationMinutes,
      }),
    }
  );
}

export function repairRevision(
  sessionId: string,
  revisionId: string
): Promise<SessionView> {
  return request<SessionView>(
    `/api/sessions/${encodeURIComponent(sessionId)}/revisions/${encodeURIComponent(revisionId)}/repair`,
    { method: 'POST' }
  );
}

export function continueSession(sessionId: string): Promise<SessionView> {
  return request<SessionView>(
    `/api/sessions/${encodeURIComponent(sessionId)}/continue`,
    { method: 'POST' }
  );
}
