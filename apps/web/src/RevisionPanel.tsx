import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import {
  applyRevision,
  previewRevision,
  type GateRecord,
  type RevisionDraft,
  type RevisionPreview,
  type RevisionTargetType,
  type RevisionType,
  type SessionView,
} from './api';

const REVISION_OPTIONS: Array<{ value: RevisionType; label: string; targetType: RevisionTargetType }> = [
  { value: 'PROJECT_DURATION_CHANGE', label: 'Change project duration', targetType: 'PROJECT' },
  { value: 'SOURCE_APPROVAL_REVOKE', label: 'Revoke / replace an approved source', targetType: 'SourceRecord' },
  { value: 'CLAIM_REVISION', label: 'Revise an approved claim', targetType: 'ClaimRecord' },
  { value: 'SHOT_REVISION', label: 'Revise an approved shot', targetType: 'ShotRecord' },
  { value: 'VISUAL_REVISION', label: 'Revise an approved visual decision', targetType: 'VisualDecisionRecord' },
];

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

function recordLabel(record: GateRecord): string {
  for (const value of [record.title, record.text, record.description, record.decision, record.interpretation]) {
    if (typeof value === 'string' && value.trim()) {
      return `${value.slice(0, 110)}${value.length > 110 ? '…' : ''}`;
    }
  }
  return record.id;
}

function recordsFor(type: RevisionType, view: SessionView): GateRecord[] {
  const pkg = view.productionPackage;
  if (!pkg) return [];
  if (type === 'SOURCE_APPROVAL_REVOKE') return pkg.sources;
  if (type === 'CLAIM_REVISION') return pkg.claims;
  if (type === 'SHOT_REVISION') return pkg.shots;
  if (type === 'VISUAL_REVISION') return pkg.visualDecisions;
  return [];
}

export function RevisionPanel({
  view,
  busy,
  onBusyChange,
  onApplied,
  onError,
}: {
  view: SessionView;
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
  onApplied: (view: SessionView) => void;
  onError: (message: string | null) => void;
}) {
  const currentDuration =
    view.projectInput.durationMinutes ??
    (typeof view.productionPackage?.filmBrief.durationMinutes === 'number'
      ? view.productionPackage.filmBrief.durationMinutes
      : 5);
  const [type, setType] = useState<RevisionType>('PROJECT_DURATION_CHANGE');
  const [targetRecordId, setTargetRecordId] = useState('');
  const [duration, setDuration] = useState(String(currentDuration));
  const [reason, setReason] = useState('');
  const [instruction, setInstruction] = useState('');
  const [preview, setPreview] = useState<RevisionPreview | null>(null);
  const targets = useMemo(() => recordsFor(type, view), [type, view]);
  const selectedOption = REVISION_OPTIONS.find((option) => option.value === type)!;

  function resetPreview(): void {
    setPreview(null);
  }

  function draft(): RevisionDraft {
    return {
      type,
      targetType: selectedOption.targetType,
      targetRecordId: type === 'PROJECT_DURATION_CHANGE' ? null : targetRecordId,
      reason: reason.trim(),
      ...(instruction.trim() ? { instruction: instruction.trim() } : {}),
      ...(type === 'PROJECT_DURATION_CHANGE'
        ? { proposedDurationMinutes: Number(duration) }
        : {}),
    };
  }

  async function runPreview(): Promise<void> {
    onBusyChange(true);
    onError(null);
    try {
      const result = await previewRevision(view.summary.sessionId, draft());
      setPreview(result);
    } catch (cause: unknown) {
      onError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      onBusyChange(false);
    }
  }

  async function runApply(): Promise<void> {
    if (!preview) return;
    onBusyChange(true);
    onError(null);
    try {
      const nextView = await applyRevision(view.summary.sessionId, preview);
      setPreview(null);
      onApplied(nextView);
    } catch (cause: unknown) {
      onError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      onBusyChange(false);
    }
  }

  const inputValid =
    reason.trim().length > 0 &&
    (type === 'PROJECT_DURATION_CHANGE'
      ? Number.isFinite(Number(duration)) && Number(duration) > 0
      : targetRecordId.length > 0);

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderColor: 'rgba(48,91,120,0.3)' }}>
      <Typography variant="overline" color="secondary.dark">Revision workspace</Typography>
      <Typography variant="h5">Improve this production without starting over</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6, maxWidth: 820 }}>
        Preview the dependency impact before changing trusted state. Tital preserves historical records, marks only affected work stale, invalidates the old audit/package boundary, and repairs from the earliest affected layer after you confirm.
      </Typography>

      <Alert severity="info" variant="outlined" sx={{ mt: 1.5 }}>
        Preview is read-only. Nothing changes until you explicitly apply the revision.
      </Alert>

      <Stack spacing={1.4} sx={{ mt: 1.75 }}>
        <TextField
          select
          label="What do you want to revise?"
          value={type}
          onChange={(event) => {
            setType(event.target.value as RevisionType);
            setTargetRecordId('');
            resetPreview();
          }}
        >
          {REVISION_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
          ))}
        </TextField>

        {type === 'PROJECT_DURATION_CHANGE' ? (
          <TextField
            type="number"
            label="New duration (minutes)"
            value={duration}
            onChange={(event) => { setDuration(event.target.value); resetPreview(); }}
            slotProps={{ htmlInput: { min: 0.5, max: 180, step: 0.5 } }}
            helperText={`Current duration: ${currentDuration} minute(s)`}
          />
        ) : (
          <TextField
            select
            label="Approved record to revise"
            value={targetRecordId}
            onChange={(event) => { setTargetRecordId(event.target.value); resetPreview(); }}
          >
            {targets.map((record) => (
              <MenuItem key={record.id} value={record.id}>
                {recordLabel(record)} — {record.id}
              </MenuItem>
            ))}
          </TextField>
        )}

        <TextField
          label="Why are you revising this?"
          value={reason}
          onChange={(event) => { setReason(event.target.value); resetPreview(); }}
          multiline
          minRows={2}
          required
          helperText="This reason becomes part of the governed revision history."
        />
        <TextField
          label="Instruction for the repaired version (optional)"
          value={instruction}
          onChange={(event) => { setInstruction(event.target.value); resetPreview(); }}
          multiline
          minRows={2}
          helperText="Example: preserve the approved science, but add more time for the scattering mechanism and use restrained camera movement."
        />
        <Box>
          <Button variant="outlined" disabled={busy || !inputValid} onClick={() => void runPreview()}>
            Preview impact
          </Button>
        </Box>
      </Stack>

      {preview && (
        <Card variant="outlined" sx={{ mt: 2, bgcolor: 'rgba(246,249,251,0.8)' }}>
          <CardContent>
            <Typography variant="overline" color="text.secondary">Deterministic impact preview</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 760 }}>{preview.impact.summary}</Typography>
            <Stack direction="row" spacing={0.65} useFlexGap sx={{ mt: 1.1, flexWrap: 'wrap' }}>
              {Object.entries(preview.impact.counts)
                .filter(([, count]) => count > 0)
                .map(([key, count]) => (
                  <Chip key={key} size="small" color="warning" variant="outlined" label={`${COUNT_LABELS[key] ?? key}: ${count}`} />
                ))}
            </Stack>
            <Divider sx={{ my: 1.4 }} />
            <Typography variant="body2">
              <strong>Preserved layers:</strong> {preview.impact.preservedLayers.join(', ') || 'None'}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              <strong>Affected layers:</strong> {preview.impact.affectedLayers.join(', ') || 'None'}
            </Typography>
            {(preview.impact.invalidatesAudit || preview.impact.invalidatesProductionPackage) && (
              <Alert severity="warning" variant="outlined" sx={{ mt: 1.25 }}>
                Applying this revision invalidates the current {preview.impact.invalidatesAudit ? 'audit' : ''}{preview.impact.invalidatesAudit && preview.impact.invalidatesProductionPackage ? ' and ' : ''}{preview.impact.invalidatesProductionPackage ? 'production package' : ''}. A revised package must pass human review and re-audit before becoming READY_FOR_PRODUCTION again.
              </Alert>
            )}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.5 }}>
              <Button variant="contained" color="warning" disabled={busy} onClick={() => void runApply()}>
                Apply revision
              </Button>
              <Button variant="text" disabled={busy} onClick={() => setPreview(null)}>Cancel preview</Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Paper>
  );
}
