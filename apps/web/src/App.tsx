import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Typography,
  type ChipProps,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import {
  ApiError,
  continueSession,
  getSession,
  listSessions,
  reviewSession,
  type ReviewCoverageGroup,
  type SessionSummary,
  type SessionView,
} from './api';
import { DirectorContextRail } from './DirectorContextRail';
import { FinalResultsPanel } from './FinalResultsPanel';
import { NewProjectPanel } from './NewProjectPanel';
import { ProvenancePanel } from './ProvenancePanel';
import { ReadableRecord, recordKindFromGateType } from './ReadableRecord';
import { WorkflowInsightsPanel } from './WorkflowInsightsPanel';

const COUNT_LABELS: Record<string, string> = {
  researchQuestions: 'Research',
  sources: 'Sources',
  evidence: 'Evidence',
  claims: 'Claims',
  scriptLines: 'Script',
  scenes: 'Scenes',
  shots: 'Shots',
  visualDecisions: 'Visuals',
};

function statusColor(status: string): ChipProps['color'] {
  if (status === 'APPROVED' || status === 'LOCKED') return 'success';
  if (status === 'REJECTED') return 'error';
  if (status === 'REVIEW_REQUIRED' || status === 'DISCOVERED') return 'warning';
  if (status === 'STALE') return 'secondary';
  return 'default';
}

function countTotal(counts: Record<string, number>): number {
  return Object.values(counts).reduce((total, value) => total + value, 0);
}

function SessionList({
  sessions,
  selectedId,
  onSelect,
}: {
  sessions: SessionSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden', position: { xl: 'sticky' }, top: { xl: 20 } }}>
      <Box sx={{ px: 2, py: 1.6 }}>
        <Typography variant="overline" color="text.secondary">Projects</Typography>
        <Typography variant="h6">Director workspace</Typography>
      </Box>
      <Divider />
      {sessions.length === 0 ? (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">No persisted projects yet.</Typography>
        </Box>
      ) : (
        <List disablePadding>
          {sessions.map((session) => (
            <ListItemButton
              key={session.sessionId}
              selected={session.sessionId === selectedId}
              onClick={() => onSelect(session.sessionId)}
              alignItems="flex-start"
              sx={{ px: 2, py: 1.4 }}
            >
              <ListItemText
                primary={session.title}
                slotProps={{
                  primary: {
                    sx: {
                      fontWeight: session.sessionId === selectedId ? 760 : 600,
                      fontSize: '0.92rem',
                    },
                  },
                }}
                secondary={
                  <Stack component="span" direction="row" spacing={0.75} useFlexGap sx={{ mt: 0.75, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Chip component="span" size="small" label={session.stage} color={session.stage === 'COMPLETE' ? 'success' : 'default'} variant="outlined" />
                    <Typography component="span" variant="caption" color="text.secondary">
                      {new Date(session.updatedAt).toLocaleDateString()}
                    </Typography>
                  </Stack>
                }
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Paper>
  );
}

function CountsGrid({ summary }: { summary: SessionSummary }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 1 }}>
      {Object.entries(summary.counts).map(([key, statuses]) => (
        <Card key={key} variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.72)' }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary">{COUNT_LABELS[key] ?? key}</Typography>
            <Typography variant="h6" sx={{ mt: 0.1 }}>{countTotal(statuses)}</Typography>
            <Stack direction="row" spacing={0.5} useFlexGap sx={{ mt: 0.65, flexWrap: 'wrap' }}>
              {Object.entries(statuses).map(([status, count]) => (
                <Chip key={status} size="small" label={`${status} ${count}`} color={statusColor(status)} variant="outlined" />
              ))}
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

function ReviewGatePanel({
  view,
  selectedIds,
  onToggle,
  onReview,
  onTryAnother,
  busy,
}: {
  view: SessionView;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onReview: (decision: 'APPROVE' | 'REJECT') => void;
  onTryAnother: () => void;
  busy: boolean;
}) {
  const gate = view.gate;
  if (!gate) {
    return (
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Typography variant="overline" color="text.secondary">Human authority</Typography>
        <Typography variant="h6">No review is waiting</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>The current stage is ready for its next governed action.</Typography>
      </Paper>
    );
  }

  const allSelected = gate.records.length > 0 && gate.records.every((record) => selectedIds.has(record.id));
  const kind = recordKindFromGateType(gate.recordType);
  const canRetrySelection =
    gate.canReject &&
    gate.recordType !== 'FilmBrief' &&
    selectedIds.size > 0 &&
    gate.coverageGroups.some((group) => group.canRetry && group.pendingRecordIds.some((id) => selectedIds.has(id)));

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.75 }, borderColor: 'rgba(185,120,36,0.34)', boxShadow: '0 12px 32px rgba(20,33,43,0.04)' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}>
        <Box>
          <Typography variant="overline" color="warning.dark">Current human gate</Typography>
          <Typography variant="h5">Review {gate.recordType}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.55, maxWidth: 760 }}>
            The model proposes. You decide what enters the trusted production chain. Rejecting a candidate preserves it in governance history; replacement is always explicit.
          </Typography>
        </Box>
        <Chip label={`${gate.records.length} pending`} color="warning" />
      </Stack>

      <Stack direction="row" spacing={0.75} sx={{ mt: 1.5 }}>
        <Button size="small" variant="text" disabled={busy || allSelected} onClick={() => gate.records.forEach((record) => { if (!selectedIds.has(record.id)) onToggle(record.id); })}>Select all</Button>
        <Button size="small" variant="text" disabled={busy || selectedIds.size === 0} onClick={() => Array.from(selectedIds).forEach(onToggle)}>Clear</Button>
      </Stack>

      <Stack spacing={1.25} sx={{ mt: 0.75 }}>
        {gate.records.map((record) => {
          const selected = selectedIds.has(record.id);
          return (
            <Card key={record.id} variant="outlined" sx={{ borderColor: selected ? 'primary.main' : 'divider', boxShadow: selected ? '0 0 0 2px rgba(21,58,82,0.07)' : 'none', transition: 'border-color 140ms ease, box-shadow 140ms ease' }}>
              <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
                  <Checkbox checked={selected} onChange={() => onToggle(record.id)} slotProps={{ input: { 'aria-label': `Select ${record.id}` } }} />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <ReadableRecord record={record} kind={kind} showId={false} />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Record ID: {record.id}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      <Divider sx={{ my: 2 }} />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Button variant="contained" color="success" disabled={busy || selectedIds.size === 0 || !gate.canApprove} onClick={() => onReview('APPROVE')}>Approve selected</Button>
        <Button variant="outlined" color="error" disabled={busy || selectedIds.size === 0 || !gate.canReject} onClick={() => onReview('REJECT')}>Reject selected</Button>
        <Button variant="outlined" disabled={busy || !canRetrySelection} onClick={onTryAnother}>Reject & try another</Button>
        {!gate.canReject && <Alert severity="info" sx={{ py: 0 }}>This record type does not support rejection in the current domain contract.</Alert>}
      </Stack>
    </Paper>
  );
}

function ContinuePanel({ view, busy, onContinue }: { view: SessionView; busy: boolean; onContinue: () => void }) {
  if (view.summary.stage === 'COMPLETE') return null;
  return (
    <Paper variant="outlined" sx={{ p: 2.25 }}>
      <Typography variant="overline" color="text.secondary">Next governed action</Typography>
      <Typography variant="h6">{view.gate ? 'Human review must finish first' : 'Advance one stage'}</Typography>
      <Alert severity={view.continueAction.mode === 'LIVE_RUNTIME' ? 'warning' : view.continueAction.enabled ? 'info' : 'success'} variant="outlined" sx={{ mt: 1.25 }}>
        {view.continueAction.message}
      </Alert>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.5, alignItems: { sm: 'center' } }}>
        <Button variant="contained" disabled={!view.continueAction.enabled || busy} onClick={onContinue}>{busy ? 'Working…' : 'Continue workflow'}</Button>
        {view.continueAction.mode === 'LIVE_RUNTIME' && <Typography variant="caption" color="text.secondary">Timings for this automated stage will be measured and added to Performance Insights.</Typography>}
      </Stack>
    </Paper>
  );
}

function ActivityPanel({ view }: { view: SessionView }) {
  return (
    <Accordion>
      <AccordionSummary>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 760 }}>Activity & governance history</Typography>
          <Chip size="small" label={view.recentEvents.length} variant="outlined" />
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={1.15}>
          {view.recentEvents.map((event) => (
            <Box key={event.id} sx={{ pb: 1.1, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 0, pb: 0 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.8} sx={{ alignItems: { sm: 'center' } }}>
                <Chip size="small" label={event.type.replaceAll('_', ' ')} variant="outlined" />
                <Typography variant="body2" sx={{ flex: 1 }}>{event.message}</Typography>
                <Typography variant="caption" color="text.secondary">{new Date(event.at).toLocaleString()}</Typography>
              </Stack>
              {event.performance && <Typography variant="caption" color="secondary.dark" sx={{ display: 'block', mt: 0.45, ml: { sm: 0.25 } }}>measured {(event.performance.durationMs / 1000).toFixed(1)}s · {event.performance.externalCallCount} external call{event.performance.externalCallCount === 1 ? '' : 's'}</Typography>}
            </Box>
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

function gapImpactText(group: ReviewCoverageGroup): string {
  if (group.targetType === 'SCENE') return 'This approved scene would have no approved shot, so it would contribute no downstream shot or visual decision.';
  if (group.targetType === 'SHOT') return 'This approved shot would have no approved visual decision.';
  if (group.targetType === 'WORKFLOW') return 'The project would have no approved research question and cannot continue.';
  return 'This approved research-question branch would have no approved result at this stage, so downstream film content for this branch can be intentionally omitted only with an explicit waiver.';
}

export function App() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<SessionView | null>(null);
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gapDialog, setGapDialog] = useState<ReviewCoverageGroup[] | null>(null);
  const [waiverReason, setWaiverReason] = useState('');
  const [replacementDialogOpen, setReplacementDialogOpen] = useState(false);
  const [replacementInstruction, setReplacementInstruction] = useState('');
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  const refreshSessions = useCallback(async () => {
    const next = await listSessions();
    setSessions(next);
    if (next.length === 0) setNewProjectOpen(true);
    setSelectedId((current) => {
      if (current && next.some((session) => session.sessionId === current)) return current;
      return next[0]?.sessionId ?? null;
    });
  }, []);

  const refreshSelectedSession = useCallback(async (sessionId: string) => {
    const nextView = await getSession(sessionId);
    setView(nextView);
    setSelectedRecordIds(new Set());
  }, []);

  useEffect(() => {
    setBusy(true);
    refreshSessions().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : String(cause))).finally(() => setBusy(false));
  }, [refreshSessions]);

  useEffect(() => {
    if (!selectedId) {
      setView(null);
      return;
    }
    setBusy(true);
    setError(null);
    refreshSelectedSession(selectedId).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : String(cause))).finally(() => setBusy(false));
  }, [refreshSelectedSession, selectedId]);

  const selectedCount = selectedRecordIds.size;

  function toggleRecord(id: string): void {
    setSelectedRecordIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function rejectionGaps(): ReviewCoverageGroup[] {
    if (!view?.gate) return [];
    return view.gate.coverageGroups.filter((group) => group.approvedRecordCount === 0 && group.pendingRecordIds.length > 0 && group.pendingRecordIds.every((id) => selectedRecordIds.has(id)));
  }

  async function submitReview(decision: 'APPROVE' | 'REJECT', options: { gapResolution?: 'RETRY' | 'WAIVE'; reason?: string } = {}): Promise<void> {
    if (!selectedId || selectedCount === 0) return;
    setBusy(true);
    setError(null);
    try {
      const nextView = await reviewSession(selectedId, decision, Array.from(selectedRecordIds), options);
      setView(nextView);
      setSelectedRecordIds(new Set());
      setGapDialog(null);
      setWaiverReason('');
      setReplacementDialogOpen(false);
      setReplacementInstruction('');
      await refreshSessions();
    } catch (cause: unknown) {
      if (cause instanceof ApiError && cause.code === 'GAP_RESOLUTION_REQUIRED' && cause.gaps?.length) setGapDialog(cause.gaps);
      else setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  function runReview(decision: 'APPROVE' | 'REJECT'): void {
    if (decision === 'REJECT') {
      const gaps = rejectionGaps();
      if (gaps.length > 0) {
        setGapDialog(gaps);
        return;
      }
    }
    void submitReview(decision);
  }

  function runTryAnother(): void {
    if (!view?.gate || selectedCount === 0 || !view.gate.canReject) return;
    setReplacementInstruction('');
    setReplacementDialogOpen(true);
  }

  async function runContinue(): Promise<void> {
    if (!selectedId || !view?.continueAction.enabled) return;
    setBusy(true);
    setError(null);
    try {
      const nextView = await continueSession(selectedId);
      setView(nextView);
      setSelectedRecordIds(new Set());
      await refreshSessions();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  async function refreshAll(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await refreshSessions();
      if (selectedId) await refreshSelectedSession(selectedId);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  async function handleProjectCreated(nextView: SessionView): Promise<void> {
    setView(nextView);
    setSelectedId(nextView.summary.sessionId);
    setSelectedRecordIds(new Set());
    setNewProjectOpen(false);
    await refreshSessions();
  }

  const canRetryGap = Boolean(gapDialog?.every((group) => group.canRetry));
  const canWaiveGap = Boolean(gapDialog?.every((group) => group.canWaive));

  return (
    <>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ gap: 1.25 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.12)', display: 'grid', placeItems: 'center', fontWeight: 800 }}>T</Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">Tital</Typography>
            <Typography variant="caption" sx={{ opacity: 0.78 }}>Director workspace · evidence-governed production</Typography>
          </Box>
          {view && <Chip size="small" label={view.summary.stage} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.25)' }} variant="outlined" />}
          <Button color="inherit" variant="text" onClick={() => setNewProjectOpen((open) => !open)}>{newProjectOpen ? 'Close new project' : 'New project'}</Button>
          <Button color="inherit" onClick={refreshAll} disabled={busy}>Refresh</Button>
        </Toolbar>
      </AppBar>

      <Dialog open={replacementDialogOpen} onClose={() => !busy && setReplacementDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject and request another candidate</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>The selected candidate remains in governance history as rejected. Tital generates a replacement for the same target only because you explicitly requested it.</Alert>
          <TextField fullWidth multiline minRows={3} label="Instruction for the replacement (optional)" value={replacementInstruction} onChange={(event) => setReplacementInstruction(event.target.value)} helperText="Describe what should change: wording, emphasis, camera behaviour, visual style, scientific caution, or another scoped preference." />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button disabled={busy} onClick={() => { setReplacementDialogOpen(false); setReplacementInstruction(''); }}>Cancel</Button>
          <Button variant="contained" disabled={busy} onClick={() => void submitReview('REJECT', { gapResolution: 'RETRY', reason: replacementInstruction.trim() || undefined })}>Reject & generate replacement</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(gapDialog)} onClose={() => !busy && setGapDialog(null)} maxWidth="md" fullWidth>
        <DialogTitle>Rejecting this would create a coverage gap</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>Tital never silently regenerates rejected content. Choose a replacement or explicitly accept an intentional omission.</Alert>
          <Stack spacing={1.5}>
            {gapDialog?.map((group) => (
              <Card key={`${group.targetType}-${group.targetId}`} variant="outlined">
                <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                  <Typography variant="subtitle2">{group.targetLabel}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{gapImpactText(group)}</Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
          {canWaiveGap ? (
            <TextField fullWidth multiline minRows={2} label="Reason for intentional omission (optional)" value={waiverReason} onChange={(event) => setWaiverReason(event.target.value)} sx={{ mt: 2 }} helperText="Stored in governance history and carried into the production package." />
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>This gap cannot be waived because Tital requires at least one approved research question.</Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, flexWrap: 'wrap' }}>
          <Button disabled={busy} onClick={() => setGapDialog(null)}>Cancel</Button>
          <Button variant="outlined" disabled={busy || !canRetryGap} onClick={() => { setGapDialog(null); setReplacementInstruction(''); setReplacementDialogOpen(true); }}>Reject & try another</Button>
          <Button variant="contained" color="warning" disabled={busy || !canWaiveGap} onClick={() => void submitReview('REJECT', { gapResolution: 'WAIVE', reason: waiverReason.trim() || undefined })}>Reject & continue with gap</Button>
        </DialogActions>
      </Dialog>

      <Container maxWidth={false} sx={{ px: { xs: 1.5, md: 2.5, xl: 3 }, py: 2.5 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {newProjectOpen && <Box sx={{ mb: 2.5 }}><NewProjectPanel busy={busy} onCreated={handleProjectCreated} onBusyChange={setBusy} onError={setError} /></Box>}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '250px minmax(0, 1fr)', xl: '250px minmax(0, 1fr) 340px' }, gap: 2, alignItems: 'start' }}>
          <SessionList sessions={sessions} selectedId={selectedId} onSelect={setSelectedId} />

          <Stack spacing={1.75}>
            {busy && !view ? (
              <Paper variant="outlined" sx={{ minHeight: 280, display: 'grid', placeItems: 'center' }}><CircularProgress /></Paper>
            ) : !view ? (
              <Paper variant="outlined" sx={{ p: 3.5, minHeight: 260 }}>
                <Typography variant="overline" color="text.secondary">Workspace</Typography>
                <Typography variant="h4">Start a governed film project</Typography>
                <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 620 }}>Create a project or choose a persisted session. Tital will keep the active human decision in the centre, with scientific and runtime context alongside it.</Typography>
                <Button variant="contained" sx={{ mt: 2 }} onClick={() => setNewProjectOpen(true)}>Create project</Button>
              </Paper>
            ) : (
              <>
                <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, background: 'linear-gradient(135deg, rgba(255,255,255,1), rgba(244,248,250,0.86))' }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { md: 'flex-start' } }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="overline" color="text.secondary">Active production</Typography>
                      <Typography variant="h4">{view.summary.title}</Typography>
                      <Typography color="text.secondary" sx={{ mt: 0.7, maxWidth: 820 }}>{view.rawIdea}</Typography>
                    </Box>
                    <Chip label={view.summary.stage} color={view.summary.stage === 'COMPLETE' ? 'success' : 'primary'} />
                  </Stack>
                  {view.coverageWaivers.length > 0 && <Alert severity="info" variant="outlined" sx={{ mt: 1.5 }}>{view.coverageWaivers.length} intentional coverage gap{view.coverageWaivers.length === 1 ? '' : 's'} accepted by human review.</Alert>}
                </Paper>

                <CountsGrid summary={view.summary} />

                {view.summary.stage !== 'COMPLETE' && (
                  <>
                    <ReviewGatePanel view={view} selectedIds={selectedRecordIds} onToggle={toggleRecord} onReview={runReview} onTryAnother={runTryAnother} busy={busy} />
                    <ContinuePanel view={view} busy={busy} onContinue={() => void runContinue()} />
                  </>
                )}

                {view.summary.stage === 'COMPLETE' && <FinalResultsPanel productionPackage={view.productionPackage} />}
                <WorkflowInsightsPanel insights={view.workflowInsights} />
                <ProvenancePanel chain={view.approvedChain} />
                <ActivityPanel view={view} />
              </>
            )}
          </Stack>

          {view && <Box sx={{ display: { xs: 'block', lg: 'none', xl: 'block' } }}><DirectorContextRail view={view} /></Box>}
        </Box>
      </Container>
    </>
  );
}
