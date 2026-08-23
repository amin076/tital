import { Box, Card, CardContent, Chip, Divider, Paper, Stack, Typography } from '@mui/material';
import type { SessionView } from './api';

interface VersionCounts {
  researchQuestions: number;
  sources: number;
  evidence: number;
  claims: number;
  scriptLines: number;
  scenes: number;
  shots: number;
  visualDecisions: number;
}

interface VersionSummary {
  version: number;
  revisionId: string | null;
  createdAt: string;
  supersededAt: string | null;
  status: 'CURRENT' | 'SUPERSEDED';
  changeSummary: string;
  durationMinutes: number;
  counts: VersionCounts;
  auditPassed: boolean;
  productionStatus: 'BLOCKED' | 'READY_FOR_PRODUCTION';
}

interface VersionComparison {
  fromVersion: number;
  toVersion: number;
  durationMinutes: { from: number; to: number; delta: number };
  countDeltas: VersionCounts;
  revisionId: string | null;
  changeSummary: string;
}

type VersionedSessionView = SessionView & {
  productionVersionHistory?: VersionSummary[];
  latestProductionVersionComparison?: VersionComparison | null;
};

const LABELS: Record<keyof VersionCounts, string> = {
  researchQuestions: 'Research',
  sources: 'Sources',
  evidence: 'Evidence',
  claims: 'Claims',
  scriptLines: 'Script',
  scenes: 'Scenes',
  shots: 'Shots',
  visualDecisions: 'Visuals',
};

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

export function ProductionHistoryPanel({ view }: { view: SessionView }) {
  const extended = view as VersionedSessionView;
  const versions = extended.productionVersionHistory ?? [];
  const comparison = extended.latestProductionVersionComparison ?? null;
  if (versions.length === 0) return null;

  return (
    <Paper variant="outlined" sx={{ p: 2.25 }}>
      <Typography variant="overline" color="text.secondary">Production history</Typography>
      <Typography variant="h6">Versioned production packages</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>
        Completed packages are immutable milestones. A governed revision supersedes the old package but keeps it available in history so you can see what changed and why.
      </Typography>

      {comparison && (
        <Card variant="outlined" sx={{ mt: 1.5, bgcolor: 'rgba(246,249,251,0.78)' }}>
          <CardContent sx={{ '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle2">
              Latest comparison · v{comparison.fromVersion} → v{comparison.toVersion}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45 }}>
              {comparison.changeSummary}
            </Typography>
            <Stack direction="row" spacing={0.6} useFlexGap sx={{ mt: 1, flexWrap: 'wrap' }}>
              <Chip size="small" variant="outlined" label={`Duration ${comparison.durationMinutes.from} → ${comparison.durationMinutes.to} min (${signed(comparison.durationMinutes.delta)})`} />
              {Object.entries(comparison.countDeltas)
                .filter(([, delta]) => delta !== 0)
                .map(([key, delta]) => (
                  <Chip key={key} size="small" variant="outlined" label={`${LABELS[key as keyof VersionCounts]} ${signed(delta)}`} />
                ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      <Divider sx={{ my: 1.5 }} />
      <Stack spacing={1}>
        {[...versions].reverse().map((version) => (
          <Box key={version.version} sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
            <Stack direction="row" spacing={0.7} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="subtitle2">v{version.version}</Typography>
              <Chip size="small" label={version.status} color={version.status === 'CURRENT' ? 'success' : 'default'} variant={version.status === 'CURRENT' ? 'filled' : 'outlined'} />
              <Chip size="small" variant="outlined" label={`${version.durationMinutes} min`} />
              <Typography variant="caption" color="text.secondary">
                {new Date(version.createdAt).toLocaleString()}
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ mt: 0.65 }}>{version.changeSummary}</Typography>
            <Stack direction="row" spacing={0.5} useFlexGap sx={{ mt: 0.8, flexWrap: 'wrap' }}>
              {(['sources', 'evidence', 'claims', 'scriptLines', 'scenes', 'shots', 'visualDecisions'] as Array<keyof VersionCounts>).map((key) => (
                <Typography key={key} variant="caption" color="text.secondary">
                  {LABELS[key]} {version.counts[key]}
                </Typography>
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
