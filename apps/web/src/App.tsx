import {
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
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { FinalResultsPanel } from './FinalResultsPanel';
import { NewProjectPanel } from './NewProjectPanel';
import { ProvenancePanel } from './ProvenancePanel';
import {
  ReadableRecord,
  recordKindFromGateType,
} from './ReadableRecord';
import { WorkflowInsightsPanel } from './WorkflowInsightsPanel';

const COUNT_LABELS: Record<string, string> = {
  researchQuestions: 'Research Questions',
  sources: 'Sources',
  evidence: 'Evidence',
  claims: 'Claims',
  scriptLines: 'Script Lines',
  scenes: 'Scenes',
  shots: 'Shots',
  visualDecisions: 'Visual Decisions',
};

function statusColor(status: string): ChipProps['color'] {
  if (status === 'APPROVED' || status === 'LOCKED') return 'success';
  if (status === 'REJECTED') return 'error';
  if (status === 'REVIEW_REQUIRED' || status === 'DISCOVERED') return 'warning';
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
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="overline" color="text.secondary">
          Persisted projects
        </Typography>
        <Typography variant="h6">Sessions</Typography>
      </Box>
      <Divider />
      {sessions.length === 0 ? (
        <Box sx={{ p: 2 }}>
          <Typography color="text.secondary">
            No persisted Tital sessions were found.
          </Typography>
        </Box>
      ) : (
        <List disablePadding>
          {sessions.map((session) => (
            <ListItemButton
              key={session.sessionId}
              selected={session.sessionId === selectedId}
              onClick={() => onSelect(session.sessionId)}
              alignItems="flex-start"
            >
              <ListItemText
                primary={session.title}
                secondary={
                  <Stack
                    component="span"
                    direction="row"
                    spacing={1}
                    sx={{ mt: 0.75, alignItems: 'center' }}
                  >
                    <Chip
                      component="span"
                      size="small"
                      label={session.stage}
                      variant="outlined"
                    />
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                    >
                      {new Date(session.updatedAt).toLocaleString()}
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
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 1.5,
      }}
    >
      {Object.entries(summary.counts).map(([key, statuses]) => (
        <Card key={key} variant="outlined">
          <CardContent sx={{ '&:last-child': { pb: 2 } }}>
            <Typography variant="body2" color="text.secondary">
              {COUNT_LABELS[key] ?? key}
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700 }}>
              {countTotal(statuses)}
            </Typography>
            <Stack
              direction="row"
              spacing={0.75}
              useFlexGap
              sx={{ mt: 1, flexWrap: 'wrap' }}
            >
              {Object.entries(statuses).map(([status, count]) => (
                <Chip
                  key={status}
                  size="small"
                  label={`${status} ${count}`}
                  color={statusColor(status)}
                  variant="outlined"
                />
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
        <Typography variant="h6">Current human gate</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          No records are waiting for human review at the current stage.
        </Typography>
      </Paper>
    );
  }

  const allSelected =
    gate.records.length > 0 &&
    gate.records.every((record) => selectedIds.has(record.id));
  const kind = recordKindFromGateType(gate.recordType);
  const canRetrySelection =
    gate.canReject &&
    gate.recordType !== 'FilmBrief' &&
    selectedIds.size > 0 &&
    gate.coverageGroups.some((group) =>
      group.canRetry && group.pendingRecordIds.some((id) => selectedIds.has(id))
    );

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
        }}
      >
        <Box>
          <Typography variant="overline" color="text.secondary">
            Human review gate
          </Typography>
          <Typography variant="h6">{gate.recordType}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Review the readable scientific content below. Machine-readable JSON remains in the persisted session and API, not in the review surface.
          </Typography>
        </Box>
        <Chip label={`${gate.records.length} pending`} color="warning" />
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
        <Button
          size="small"
          variant="text"
          disabled={busy || allSelected}
          onClick={() =>
            gate.records.forEach((record) => {
              if (!selectedIds.has(record.id)) onToggle(record.id);
            })
          }
        >
          Select all pending
        </Button>
        <Button
          size="small"
          variant="text"
          disabled={busy || selectedIds.size === 0}
          onClick={() => Array.from(selectedIds).forEach(onToggle)}
        >
          Clear selection
        </Button>
      </Stack>

      <Stack spacing={1.5} sx={{ mt: 1 }}>
        {gate.records.map((record) => (
          <Card
            key={record.id}
            variant="outlined"
            sx={{
              borderColor: selectedIds.has(record.id)
                ? 'primary.main'
                : 'divider',
            }}
          >
            <CardContent sx={{ '&:last-child': { pb: 2 } }}>
              <Stack
                direction="row"
                spacing={1.25}
                sx={{ alignItems: 'flex-start' }}
              >
                <Checkbox
                  checked={selectedIds.has(record.id)}
                  onChange={() => onToggle(record.id)}
                  slotProps={{
                    input: { 'aria-label': `Select ${record.id}` },
                  }}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <ReadableRecord record={record} kind={kind} showId />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Divider sx={{ my: 2 }} />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <Button
          variant="contained"
          color="success"
          disabled={busy || selectedIds.size === 0 || !gate.canApprove}
          onClick={() => onReview('APPROVE')}
        >
          Approve selected
        </Button>
        <Button
          variant="outlined"
          color="error"
          disabled={busy || selectedIds.size === 0 || !gate.canReject}
          onClick={() => onReview('REJECT')}
        >
          Reject selected
        </Button>
        <Button
          variant="outlined"
          disabled={busy || !canRetrySelection}
          onClick={onTryAnother}
        >
          Reject & try another
        </Button>
        {!gate.canReject && (
          <Alert severity="info" sx={{ py: 0 }}>
            This record type does not support rejection in the current domain contract.
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}

function gapImpactText(group: ReviewCoverageGroup): string {
  if (group.targetType === 'SCENE') {
    return 'This approved scene would have no approved shot, so it would contribute no downstream shot or visual decision.';
  }
  if (group.targetType === 'SHOT') {
    return 'This approved shot would have no approved visual decision.';
  }
  if (group.targetType === 'WORKFLOW') {
    return 'The project would have no approved research question and cannot continue.';
  }
  return 'This approved research-question branch would have no approved result at this stage, so downstream film content for this branch can be intentionally omitted only with an explicit waiver.';
}

export function App() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<SessionView | null>(null);
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(
    () => new Set()
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gapDialog, setGapDialog] = useState<ReviewCoverageGroup[] | null>(null);
  const [waiverReason, setWaiverReason] = useState('');
  const [replacementDialogOpen, setReplacementDialogOpen] = useState(false);
  const [replacementInstruction, setReplacementInstruction] = useState('');

  const refreshSessions = useCallback(async () => {
    const next = await listSessions();
    setSessions(next);
    setSelectedId((current) => {
      if (current && next.some((session) => session.sessionId === current)) {
        return current;
      }
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
    refreshSessions()
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : String(cause));
      })
      .finally(() => setBusy(false));
  }, [refreshSessions]);

  useEffect(() => {
    if (!selectedId) {
      setView(null);
      return;
    }

    setBusy(true);
    setError(null);
    refreshSelectedSession(selectedId)
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : String(cause));
      })
      .finally(() => setBusy(false));
  }, [refreshSelectedSession, selectedId]);

  const selectedCount = selectedRecordIds.size;
  const canContinue = useMemo(
    () => Boolean(view?.continueAction.enabled),
    [view]
  );

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
    return view.gate.coverageGroups.filter(
      (group) =>
        group.approvedRecordCount === 0 &&
        group.pendingRecordIds.length > 0 &&
        group.pendingRecordIds.every((id) => selectedRecordIds.has(id))
    );
  }

  async function submitReview(
    decision: 'APPROVE' | 'REJECT',
    options: { gapResolution?: 'RETRY' | 'WAIVE'; reason?: string } = {}
  ): Promise<void> {
    if (!selectedId || selectedCount === 0) return;
    setBusy(true);
    setError(null);
    try {
      const nextView = await reviewSession(
        selectedId,
        decision,
        Array.from(selectedRecordIds),
        options
      );
      setView(nextView);
      setSelectedRecordIds(new Set());
      setGapDialog(null);
      setWaiverReason('');
      setReplacementDialogOpen(false);
      setReplacementInstruction('');
      await refreshSessions();
    } catch (cause: unknown) {
      if (
        cause instanceof ApiError &&
        cause.code === 'GAP_RESOLUTION_REQUIRED' &&
        cause.gaps?.length
      ) {
        setGapDialog(cause.gaps);
      } else {
        setError(cause instanceof Error ? cause.message : String(cause));
      }
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
    if (!selectedId || !canContinue) return;
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
    await refreshSessions();
  }

  const canRetryGap = Boolean(gapDialog?.every((group) => group.canRetry));
  const canWaiveGap = Boolean(gapDialog?.every((group) => group.canWaive));

  return (
    <>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">Tital</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Evidence-Governed Scientific Film Director
            </Typography>
          </Box>
          <Button color="inherit" onClick={refreshAll} disabled={busy}>
            Refresh
          </Button>
        </Toolbar>
      </AppBar>

      <Dialog
        open={replacementDialogOpen}
        onClose={() => !busy && setReplacementDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject and request another candidate</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            The selected candidate will remain in governance history as rejected. Tital will generate a new candidate for the same target even when that target already has other approved coverage.
          </Alert>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Instruction for the replacement (optional)"
            value={replacementInstruction}
            onChange={(event) => setReplacementInstruction(event.target.value)}
            helperText="Describe what should change: wording, emphasis, camera behaviour, visual style, scientific caution, or another scoped preference. Scientific evidence and integrity constraints still take priority."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            disabled={busy}
            onClick={() => {
              setReplacementDialogOpen(false);
              setReplacementInstruction('');
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={busy}
            onClick={() =>
              void submitReview('REJECT', {
                gapResolution: 'RETRY',
                reason: replacementInstruction.trim() || undefined,
              })
            }
          >
            Reject & generate replacement
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(gapDialog)}
        onClose={() => !busy && setGapDialog(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Rejecting this would create a coverage gap</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Tital will not silently regenerate content after a human rejection. Choose whether you want a replacement candidate or intentionally continue without this branch.
          </Alert>
          <Stack spacing={1.5}>
            {gapDialog?.map((group) => (
              <Card key={`${group.targetType}-${group.targetId}`} variant="outlined">
                <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                  <Typography variant="subtitle2">{group.targetLabel}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {gapImpactText(group)}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
          {canWaiveGap && (
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Reason for intentional omission (optional)"
              value={waiverReason}
              onChange={(event) => setWaiverReason(event.target.value)}
              sx={{ mt: 2 }}
              helperText="This reason is stored in governance history and included with the production package."
            />
          )}
          {!canWaiveGap && (
            <Alert severity="info" sx={{ mt: 2 }}>
              This gap cannot be waived because Tital requires at least one approved research question for the project.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, flexWrap: 'wrap' }}>
          <Button disabled={busy} onClick={() => setGapDialog(null)}>
            Cancel
          </Button>
          <Button
            variant="outlined"
            disabled={busy || !canRetryGap}
            onClick={() => {
              setGapDialog(null);
              setReplacementInstruction('');
              setReplacementDialogOpen(true);
            }}
          >
            Reject & try another
          </Button>
          <Button
            variant="contained"
            color="warning"
            disabled={busy || !canWaiveGap}
            onClick={() =>
              void submitReview('REJECT', {
                gapResolution: 'WAIVE',
                reason: waiverReason.trim() || undefined,
              })
            }
          >
            Reject & continue with gap
          </Button>
        </DialogActions>
      </Dialog>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <NewProjectPanel
          busy={busy}
          onCreated={handleProjectCreated}
          onBusyChange={setBusy}
          onError={setError}
        />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '300px minmax(0, 1fr)' },
            gap: 2.5,
            alignItems: 'start',
            mt: 2.5,
          }}
        >
          <SessionList
            sessions={sessions}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          <Stack spacing={2}>
            {busy && !view ? (
              <Paper
                variant="outlined"
                sx={{
                  minHeight: 240,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <CircularProgress />
              </Paper>
            ) : !view ? (
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6">No session selected</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  Create a new project above or select a persisted Tital session.
                </Typography>
              </Paper>
            ) : (
              <>
                <Paper variant="outlined" sx={{ p: 2.5 }}>
                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                    sx={{
                      justifyContent: 'space-between',
                      alignItems: { xs: 'flex-start', md: 'center' },
                    }}
                  >
                    <Box>
                      <Typography variant="h4">{view.summary.title}</Typography>
                      <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                        {view.rawIdea}
                      </Typography>
                    </Box>
                    <Chip
                      label={view.summary.stage}
                      color={
                        view.summary.stage === 'COMPLETE'
                          ? 'success'
                          : 'primary'
                      }
                    />
                  </Stack>

                  <Divider sx={{ my: 2 }} />
                  <Typography variant="overline" color="text.secondary">
                    Next action
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>
                    {view.summary.nextAction}
                  </Typography>

                  {view.summary.blockedBy.length > 0 && (
                    <Stack
                      direction="row"
                      spacing={0.75}
                      useFlexGap
                      sx={{ mt: 1.5, flexWrap: 'wrap' }}
                    >
                      {view.summary.blockedBy.map((blocker) => (
                        <Chip
                          key={blocker}
                          label={blocker}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  )}

                  {view.coverageWaivers.length > 0 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      {view.coverageWaivers.length} intentional coverage gap{view.coverageWaivers.length === 1 ? '' : 's'} accepted by human review. These remain in governance history and the production package.
                    </Alert>
                  )}
                </Paper>

                <CountsGrid summary={view.summary} />
                <WorkflowInsightsPanel insights={view.workflowInsights} />
                <FinalResultsPanel productionPackage={view.productionPackage} />
                <ProvenancePanel chain={view.approvedChain} />

                {view.summary.stage !== 'COMPLETE' && (
                  <>
                    <ReviewGatePanel
                      view={view}
                      selectedIds={selectedRecordIds}
                      onToggle={toggleRecord}
                      onReview={runReview}
                      onTryAnother={runTryAnother}
                      busy={busy}
                    />

                    <Paper variant="outlined" sx={{ p: 2.5 }}>
                      <Typography variant="h6">Continue workflow</Typography>
                      <Alert
                        severity={
                          view.continueAction.mode === 'LIVE_RUNTIME'
                            ? 'warning'
                            : view.continueAction.enabled
                              ? 'info'
                              : 'success'
                        }
                        sx={{ mt: 1.5 }}
                      >
                        {view.continueAction.message}
                      </Alert>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1}
                        sx={{ mt: 2 }}
                      >
                        <Button
                          variant="contained"
                          disabled={!canContinue || busy}
                          onClick={runContinue}
                        >
                          {busy ? 'Working…' : 'Continue'}
                        </Button>
                        {view.gate && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ alignSelf: 'center' }}
                          >
                            Review the current gate before continuing.
                          </Typography>
                        )}
                      </Stack>
                    </Paper>
                  </>
                )}

                <Paper variant="outlined" sx={{ p: 2.5 }}>
                  <Typography variant="h6">Recent session events</Typography>
                  <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                    {view.recentEvents.map((event) => (
                      <Box key={event.id}>
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={1}
                          sx={{
                            alignItems: { xs: 'flex-start', sm: 'center' },
                          }}
                        >
                          <Chip
                            size="small"
                            label={event.type}
                            variant="outlined"
                          />
                          <Typography variant="body2" sx={{ flex: 1 }}>
                            {event.message}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {new Date(event.at).toLocaleString()}
                          </Typography>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </>
            )}
          </Stack>
        </Box>
      </Container>
    </>
  );
}