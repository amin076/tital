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
    operations: SessionPerformanceOperation[];
  };
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
  generatedAt: string;
  status: 'BLOCKED' | 'READY_FOR_PRODUCTION';
}

export interface SessionView {
  summary: SessionSummary;
  rawIdea: string;
  projectInput: CreateSessionInput;
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
  options: { gapResolution?: 'RETRY' | 'WAIVE'; reason?: string } = {}
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
      }),
    }
  );
}

export function continueSession(sessionId: string): Promise<SessionView> {
  return request<SessionView>(
    `/api/sessions/${encodeURIComponent(sessionId)}/continue`,
    { method: 'POST' }
  );
}
