import { Box, Chip, Divider, Paper, Stack, Typography } from '@mui/material';
import type { SessionView } from './api';
import { PerformanceInsightsPanel } from './PerformanceInsightsPanel';

const LABELS: Record<string, string> = {
  AI_ASSISTED: 'AI-assisted',
  COLLABORATIVE: 'Collaborative',
  DIRECTOR_LED: 'Director-led',
  CONTEMPLATIVE: 'Contemplative',
  BALANCED: 'Balanced',
  ENERGETIC: 'Energetic',
  RESTRAINED: 'Restrained',
  EXPRESSIVE: 'Expressive',
  REAL_IMAGERY_FIRST: 'Real imagery first',
  EXPLANATORY_VISUALS_FIRST: 'Explanatory visuals first',
};

function nice(value: string | undefined): string {
  if (!value) return 'Not set';
  return LABELS[value] ?? value.replaceAll('_', ' ').toLowerCase();
}

export function DirectorContextRail({ view }: { view: SessionView }) {
  const brief = view.projectInput.directorBrief;

  return (
    <Stack spacing={1.5} sx={{ position: { xl: 'sticky' }, top: { xl: 20 } }}>
      <Paper variant="outlined" sx={{ p: 2.25 }}>
        <Typography variant="overline" color="text.secondary">Current context</Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">{view.workflowInsights.steps.find((step) => step.status === 'CURRENT')?.label ?? view.summary.stage}</Typography>
          <Chip size="small" label={view.summary.stage} color={view.summary.stage === 'COMPLETE' ? 'success' : 'primary'} />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {view.summary.nextAction}
        </Typography>
        {view.summary.blockedBy.length > 0 && (
          <Stack direction="row" spacing={0.5} useFlexGap sx={{ mt: 1.25, flexWrap: 'wrap' }}>
            {view.summary.blockedBy.map((blocker) => (
              <Chip key={blocker} size="small" label={blocker} color="warning" variant="outlined" />
            ))}
          </Stack>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2.25 }}>
        <Typography variant="overline" color="text.secondary">Director brief</Typography>
        <Typography variant="h6">Creative operating envelope</Typography>
        {!brief ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This project predates the structured Director Brief.
          </Typography>
        ) : (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 1.5, rowGap: 1.25, mt: 1.5 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Collaboration</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{nice(brief.collaborationMode)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Pacing</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{nice(brief.pacing)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Camera</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{nice(brief.cameraMovement)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Representation</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{nice(brief.representationPreference)}</Typography>
              </Box>
            </Box>
            {(brief.visualStyle || brief.notes || brief.avoid.length > 0) && <Divider sx={{ my: 1.5 }} />}
            {brief.visualStyle && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">Visual language</Typography>
                <Typography variant="body2">{brief.visualStyle}</Typography>
              </Box>
            )}
            {brief.notes && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">Director notes</Typography>
                <Typography variant="body2">{brief.notes}</Typography>
              </Box>
            )}
            {brief.avoid.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary">Avoid</Typography>
                <Stack direction="row" spacing={0.5} useFlexGap sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                  {brief.avoid.map((item) => <Chip key={item} size="small" label={item} variant="outlined" />)}
                </Stack>
              </Box>
            )}
          </>
        )}
      </Paper>

      <PerformanceInsightsPanel insights={view.performanceInsights} />
    </Stack>
  );
}
