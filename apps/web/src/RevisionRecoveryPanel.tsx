import { Alert, Button, Paper, Stack, Typography } from '@mui/material';
import { repairRevision, type RevisionRequest, type SessionView } from './api';

function latestRevision(view: SessionView): RevisionRequest | null {
  return view.revisionRequests.length > 0
    ? view.revisionRequests[view.revisionRequests.length - 1] ?? null
    : null;
}

export function RevisionRecoveryPanel({
  view,
  busy,
  onBusyChange,
  onRepaired,
  onError,
}: {
  view: SessionView;
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
  onRepaired: (view: SessionView) => void;
  onError: (message: string | null) => void;
}) {
  const revision = latestRevision(view);
  if (!revision || (revision.status !== 'APPLIED' && revision.status !== 'REPAIRING')) {
    return null;
  }

  async function runRepair(): Promise<void> {
    if (!revision || revision.status !== 'APPLIED') return;
    onBusyChange(true);
    onError(null);
    try {
      const nextView = await repairRevision(view.summary.sessionId, revision.id);
      onRepaired(nextView);
    } catch (cause: unknown) {
      onError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      onBusyChange(false);
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 2.25, borderColor: 'warning.light' }}>
      <Typography variant="overline" color="warning.dark">Active revision</Typography>
      <Typography variant="h6">{revision.type.replaceAll('_', ' ')}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {revision.reason}
      </Typography>

      {revision.status === 'APPLIED' ? (
        <Alert severity="warning" variant="outlined" sx={{ mt: 1.4 }}>
          The old dependent records are preserved as STALE and the prior audit/package is invalid. Generate a replacement only for the earliest affected layer; human review will then govern the repaired path.
        </Alert>
      ) : (
        <Alert severity="info" variant="outlined" sx={{ mt: 1.4 }}>
          Selective repair has started. Review the new candidate(s) when they appear, then continue the workflow. STALE historical records remain visible but no longer block deliberate regeneration.
        </Alert>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.4, alignItems: { sm: 'center' } }}>
        {revision.status === 'APPLIED' && (
          <Button variant="contained" color="warning" disabled={busy || Boolean(view.gate)} onClick={() => void runRepair()}>
            Repair affected branch
          </Button>
        )}
        <Typography variant="caption" color="text.secondary">
          Revision {revision.id} · {revision.status}
        </Typography>
      </Stack>
    </Paper>
  );
}
