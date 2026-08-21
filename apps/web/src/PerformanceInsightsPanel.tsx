import { Alert, Box, Chip, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import type { PerformanceInsights } from './api';

const STAGE_LABELS: Record<string, string> = {
  DEFINE: 'FilmBrief',
  RESEARCH: 'Source discovery',
  EVIDENCE: 'Evidence',
  CLAIMS: 'Claims',
  SCRIPT: 'Script',
  SCENES: 'Scenes',
  SHOTS: 'Shots',
  VISUAL_DECISIONS: 'Visual decisions',
  AUDIT: 'Audit',
  PACKAGE: 'Package',
  COMPLETE: 'Complete',
};

function formatDuration(ms: number): string {
  if (ms < 1_000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1_000).toFixed(ms < 10_000 ? 1 : 0)} s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1_000);
  return `${minutes}m ${seconds}s`;
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="h6" sx={{ mt: 0.15 }}>{value}</Typography>
      {note && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.15, lineHeight: 1.35 }}>
          {note}
        </Typography>
      )}
    </Box>
  );
}

export function PerformanceInsightsPanel({ insights }: { insights: PerformanceInsights }) {
  if (!insights.measured) {
    return (
      <Paper variant="outlined" sx={{ p: 2.25 }}>
        <Typography variant="overline" color="text.secondary">Runtime performance</Typography>
        <Typography variant="h6">No measured executions yet</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          New live automated work records wall-clock duration and external-call timing. Older sessions that predate instrumentation remain explicitly unmeasured.
        </Typography>
      </Paper>
    );
  }

  const maxStageDuration = Math.max(...insights.stages.map((stage) => stage.durationMs), 1);
  const concurrencyLabel = insights.concurrencyLimits.length === 0
    ? null
    : insights.concurrencyLimits.length === 1
      ? `Concurrency limit ${insights.concurrencyLimits[0]}`
      : `Concurrency limits ${insights.concurrencyLimits.join(', ')}`;

  return (
    <Paper variant="outlined" sx={{ p: 2.25 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="overline" color="text.secondary">Runtime performance</Typography>
          <Typography variant="h6">Measured agent-call profile</Typography>
        </Box>
        <Chip
          size="small"
          label={`${insights.measuredStageCount} stages · ${insights.measuredExecutionCount} executions`}
          color="secondary"
          variant="outlined"
          sx={{ flexShrink: 0 }}
        />
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5, mt: 2 }}>
        <Stat
          label="Measured automated runtime"
          value={formatDuration(insights.durationMs)}
          note={insights.includesProjectCreation ? 'Includes FilmBrief creation and later automated stages' : 'Legacy session: FilmBrief creation was not measured'}
        />
        <Stat label="External calls" value={String(insights.externalCallCount)} note={`${insights.failedCallCount} failed`} />
        <Stat label="Slowest stage" value={insights.slowestStage ? STAGE_LABELS[insights.slowestStage] ?? insights.slowestStage : '—'} />
        <Stat
          label="Parallel overlap"
          value={insights.parallelOverlapFactor ? `${insights.parallelOverlapFactor.toFixed(2)}×` : '—'}
          note="External-call work ÷ wall time; not a before/after speedup"
        />
      </Box>

      {concurrencyLabel && (
        <Chip
          size="small"
          label={concurrencyLabel}
          color="secondary"
          variant="outlined"
          sx={{ mt: 1.5 }}
        />
      )}

      {!insights.includesProjectCreation && (
        <Alert severity="info" variant="outlined" sx={{ mt: 1.75 }}>
          This project predates project-creation timing, so the total excludes the initial FilmBrief generation call. New projects include it automatically.
        </Alert>
      )}

      <Box sx={{ mt: 2.25 }}>
        <Typography variant="subtitle2">Stage profile</Typography>
        <Stack spacing={1.15} sx={{ mt: 1.1 }}>
          {insights.stages.slice(0, 10).map((stage) => (
            <Box key={stage.stage}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {STAGE_LABELS[stage.stage] ?? stage.stage}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right' }}>
                  {formatDuration(stage.durationMs)} · {stage.externalCallCount} call{stage.externalCallCount === 1 ? '' : 's'}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={(stage.durationMs / maxStageDuration) * 100}
                color={stage.failedCallCount > 0 ? 'warning' : 'secondary'}
                sx={{ mt: 0.55, height: 6, borderRadius: 99, bgcolor: 'rgba(35,118,111,0.08)' }}
              />
              <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 0.4, flexWrap: 'wrap' }}>
                {stage.parallelOverlapFactor && stage.externalCallCount > 1 && (
                  <Typography variant="caption" color="text.secondary">
                    overlap {stage.parallelOverlapFactor.toFixed(2)}×
                  </Typography>
                )}
                {stage.slowestCallMs > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    slowest call {formatDuration(stage.slowestCallMs)}
                  </Typography>
                )}
                {stage.executions > 1 && (
                  <Typography variant="caption" color="text.secondary">
                    {stage.executions} executions
                  </Typography>
                )}
                {stage.internalWorkMs > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    internal measured work {formatDuration(stage.internalWorkMs)}
                  </Typography>
                )}
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>

      {insights.slowestOperationName && (
        <Alert severity={insights.failedCallCount > 0 ? 'warning' : 'info'} variant="outlined" sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Slowest measured external call: {formatDuration(insights.slowestCallMs)}
          </Typography>
          <Typography variant="caption" sx={{ overflowWrap: 'anywhere' }}>
            {insights.slowestOperationName}{insights.slowestTargetId ? ` · ${insights.slowestTargetId}` : ''}
          </Typography>
        </Alert>
      )}
    </Paper>
  );
}
