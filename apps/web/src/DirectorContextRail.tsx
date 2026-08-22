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

function currentContextLabel(view: SessionView): string {
  if (view.summary.stage === 'COMPLETE') return 'Production ready';
  return view.workflowInsights.steps.find((step) => step.status === 'CURRENT')?.label ?? view.summary.stage;
}

export function DirectorContextRail({ view }: { view: SessionView }) {
  const brief = view.projectInput.directorBrief;

  return (
    <Stack spacing={1.5} sx={{ position: { xl: 'sticky' }, top: { xl: 20 } }}>
      <Paper variant="outlined" sx={{ p: 2.25 }}>
        <Typography variant="overline" color="text.secondary">Current context</Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">{currentContextLabel(view)}</Typography>
          <Chip
            size="small"
            label={view.summary.stage}
            color={view.summary.stage === 'COMPLETE' ? 'success' : 'primary'}
            variant={view.summary.stage === 'COMPLETE' ? 'filled' : 'outlined'}
          />
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
              <Box sx={{ mb: 1.1 }}>
                <Typography variant="caption" color="text.secondary">Visual language</Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.55 }}>{brief.visualStyle}</Typography>
              </Box>
            )}
            {brief.notes && (
              <Box sx={{ mb: 1.1 }}>
                <Typography variant="caption" color="text.secondary">Director notes</Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.55 }}>{brief.notes}</Typography>
              </Box>
            )}
            {brief.avoid.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary">Avoid</Typography>
                <Stack direction="row" spacing={0.5} useFlexGap sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                  {brief.avoid.map((item) => (
                    <Chip
                      key={item}
                      size="small"
                      label={item}
                      variant="outlined"
                      sx={{
                        maxWidth: '100%',
                        height: 'auto',
                        alignItems: 'flex-start',
                        '& .MuiChip-label': {
                          display: 'block',
                          whiteSpace: 'normal',
                          overflowWrap: 'anywhere',
                          py: 0.45,
                          lineHeight: 1.35,
                        },
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2.25 }}>
        <Typography variant="overline" color="text.secondary">Director feedback memory</Typography>
        <Typography variant="h6">Preferences learned by explicit choice</Typography>
        {view.directorFeedback.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No review instruction has been marked for reuse yet. Replacement feedback remains scoped unless the director chooses to remember it.
          </Typography>
        ) : (
          <Stack spacing={1} sx={{ mt: 1.25 }}>
            {view.directorFeedback.slice(-5).reverse().map((feedback) => (
              <Box key={feedback.id} sx={{ p: 1.1, borderRadius: 2.5, bgcolor: '#F5F8FA', border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                  <Chip size="small" label={feedback.stage} variant="outlined" />
                  <Typography variant="caption" color="text.secondary">
                    {new Date(feedback.capturedAt).toLocaleDateString()}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ mt: 0.7, lineHeight: 1.5 }}>
                  {feedback.instruction}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      <PerformanceInsightsPanel insights={view.performanceInsights} />
    </Stack>
  );
}
