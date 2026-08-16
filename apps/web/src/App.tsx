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
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Toolbar,
  Typography,
  type ChipProps,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  continueSession,
  getSession,
  listSessions,
  reviewSession,
  type GateRecord,
  type SessionSummary,
  type SessionView,
} from './api';
import { FinalResultsPanel } from './FinalResultsPanel';
import { NewProjectPanel } from './NewProjectPanel';
import { ProvenancePanel } from './ProvenancePanel';
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

function valueAsString(record: GateRecord, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

function recordTitle(record: GateRecord): string {
  return (
    valueAsString(record, 'title') ??
    valueAsString(record, 'question') ??
    valueAsString(record, 'text') ??
    valueAsString(record, 'description') ??
    valueAsString(record, 'decision') ??
    valueAsString(record, 'excerpt') ??
    record.id
  );
}

function recordDetail(record: GateRecord): string | null {
  for (const key of [
    'purpose',
    'interpretation',
    'visualSummary',
    'scientificConstraint',
    'uncertainty',
    'uncertaintyDisclosure',
    'excerpt',
  ]) {
    const value = valueAsString(record, key);
    if (value && value !== recordTitle(record)) return value;
  }
  return null;
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
  busy,
}: {
  view: SessionView;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onReview: (decision: 'APPROVE' | 'REJECT') => void;
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

  const allSelected = gate.records.length > 0 && gate.records.every((record) => selectedIds.has(record.id));

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
        </Box>
        <Chip label={`${gate.records.length} pending`} color="warning" />
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
        <Button
          size="small"
          variant="text"
          disabled={busy || allSelected}
          onClick={() => gate.records.forEach((record) => {
            if (!selectedIds.has(record.id)) onToggle(record.id);
          })}
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
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    sx={{ alignItems: { xs: 'flex-start', sm: 'center' } }}
                  >
                    <Typography sx={{ fontWeight: 700, flex: 1 }}>
                      {recordTitle(record)}
                    </Typography>
                    <Chip
                      size="small"
                      label={record.status}
                      color={statusColor(record.status)}
                      variant="outlined"
                    />
                  </Stack>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 0.5 }}
                  >
                    {record.id}
                  </Typography>

                  {recordDetail(record) && (
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                      {recordDetail(record)}
                    </Typography>
                  )}

                  <Accordion
                    disableGutters
                    elevation={0}
                    sx={{
                      mt: 1,
                      '&::before': { display: 'none' },
                      backgroundColor: 'transparent',
                    }}
                  >
                    <AccordionSummary sx={{ px: 0, minHeight: 36 }}>
                      <Typography variant="body2" color="primary">
                        Inspect structured record
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 0, pt: 0 }}>
                      <Box
                        component="pre"
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          bgcolor: 'grey.100',
                          fontSize: 12,
                          overflow: 'auto',
                        }}
                      >
                        {JSON.stringify(record, null, 2)}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
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
        {!gate.canReject && (
          <Alert severity="info" sx={{ py: 0 }}>
            This record type does not support rejection in the current domain contract.
          </Alert>
        )}
      </Stack>
    </Paper>
  );
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

  async function runReview(decision: 'APPROVE' | 'REJECT'): Promise<void> {
    if (!selectedId || selectedCount === 0) return;
    setBusy(true);
    setError(null);
    try {
      const nextView = await reviewSession(
        selectedId,
        decision,
        Array.from(selectedRecordIds)
      );
      setView(nextView);
      setSelectedRecordIds(new Set());
      await refreshSessions();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
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
                </Paper>

                <CountsGrid summary={view.summary} />
                <WorkflowInsightsPanel insights={view.workflowInsights} />
                <FinalResultsPanel productionPackage={view.productionPackage} />
                <ProvenancePanel chain={view.approvedChain} />

                <ReviewGatePanel
                  view={view}
                  selectedIds={selectedRecordIds}
                  onToggle={toggleRecord}
                  onReview={runReview}
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
                    {view.summary.stage === 'COMPLETE' && (
                      <Chip
                        label={
                          view.summary.productionPackageStatus ??
                          'Workflow complete'
                        }
                        color="success"
                      />
                    )}
                  </Stack>
                </Paper>

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
