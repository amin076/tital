import { Alert, Box, Chip, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import type { PerformanceInsights } from './api';

const STAGE_LABELS: Record<string, string> = {
  DEFINE: 'Define',
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
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.15 }}>
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
        <Typography variant="h6">No measured stage traces yet</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          New live automated stages record wall-clock duration and external-call timing. Older sessions that predate instrumentation remain explicitly unmeasured.
        </Typography>
      </Paper>
    );
  }

  const maxStageDuration = Math.max(...insights.stages.map((stage) => stage.durationMs), 1);

  return (
    <Paper variant="outlined" sx={{ p: 2.25 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="overline" color="text.secondary">Runtime performance</Typography>
          <Typography variant="h6">Measured agent-call profile</Typography>
        </Box>
        <Chip size="small" label={`${insights.measuredEventCount} measured stage${insights.measuredEventCount === 1 ? '' : 's'}`} color="secondary" variant="outlined" />
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5, mt: 2 }}>
        <Stat label="Automated stage wall time" value={formatDuration(insights.durationMs)} note="Measured Continue executions only" />
        <Stat label="External calls" value={String(insights.externalCallCount)} note={`${insights.failedCallCount} failed`} />
        <Stat label="Slowest stage" value={insights.slowestStage ? STAGE_LABELS[insights.slowestStage] ?? insights.slowestStage : '—'} />
        <Stat
          label="Parallel overlap"
          value={insights.parallelOverlapFactor ? `${insights.parallelOverlapFactor.toFixed(2)}×` : '—'}
          note="External-call work ÷ wall time; not a before/after speedup"
        />
      </Box>

      <Box sx={{ mt: 2.25 }}>
        <Typography variant="subtitle2">Stage profile</Typography>
        <Stack spacing={1.15} sx={{ mt: 1.1 }}>
          {insights.stages.slice(0, 8).map((stage) => (
            <Box key={stage.stage}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {STAGE_LABELS[stage.stage] ?? stage.stage}
                </Typography>
                <Typography variant="caption" color="text.secondary">
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
                {stage.attempts > 1 && (
                  <Typography variant="caption" color="text.secondary">
                    {stage.attempts} attempts
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
          <Typography variant="caption">
            {insights.slowestOperationName}{insights.slowestTargetId ? ` · ${insights.slowestTargetId}` : ''}
          </Typography>
        </Alert>
      )}
    </Paper>
  );
}
