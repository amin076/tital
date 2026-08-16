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

export interface ReviewGate {
  stage: string;
  recordType: string;
  records: GateRecord[];
  canApprove: boolean;
  canReject: boolean;
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

export interface SessionEvent {
  id: string;
  type: string;
  at: string;
  stage: string;
  message: string;
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
  total: number;
  complete: boolean;
  missingParentIds: string[];
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
  audit: ScientificAudit;
  generatedAt: string;
  status: 'BLOCKED' | 'READY_FOR_PRODUCTION';
}

export interface SessionView {
  summary: SessionSummary;
  rawIdea: string;
  gate: ReviewGate | null;
  continueAction: ContinueAction;
  workflowInsights: WorkflowInsights;
  approvedChain: ApprovedChain;
  audit: ScientificAudit | null;
  productionPackage: ProductionPackage | null;
  recentEvents: SessionEvent[];
}

async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  const body = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(body.error || `Request failed with status ${response.status}.`);
  }

  return body;
}

export function listSessions(): Promise<SessionSummary[]> {
  return request<SessionSummary[]>('/api/sessions');
}

export function createSession(rawIdea: string): Promise<SessionView> {
  return request<SessionView>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({ rawIdea }),
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
  recordIds: string[]
): Promise<SessionView> {
  return request<SessionView>(
    `/api/sessions/${encodeURIComponent(sessionId)}/review`,
    {
      method: 'POST',
      body: JSON.stringify({
        decision,
        recordIds,
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
