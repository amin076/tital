import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import type { WorkflowInsights } from './api';

function StepDot({ status }: { status: 'COMPLETE' | 'CURRENT' | 'UPCOMING' }) {
  const complete = status === 'COMPLETE';
  const current = status === 'CURRENT';
  return (
    <Box
      aria-hidden
      sx={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        flex: '0 0 auto',
        fontSize: 13,
        fontWeight: 800,
        color: complete || current ? '#fff' : 'text.secondary',
        bgcolor: complete ? 'success.main' : current ? 'primary.main' : '#EEF2F4',
        border: current ? '3px solid #D9E8F0' : '1px solid',
        borderColor: complete ? 'success.main' : current ? 'primary.main' : 'divider',
      }}
    >
      {complete ? '✓' : current ? '•' : ''}
    </Box>
  );
}

export function WorkflowInsightsPanel({
  insights,
}: {
  insights: WorkflowInsights;
}) {
  const completedSteps = insights.steps.filter((step) => step.status === 'COMPLETE').length;
  const stepProgress = insights.steps.length === 0 ? 0 : (completedSteps / insights.steps.length) * 100;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.25, md: 3 } }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { md: 'flex-end' } }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Workflow clarity
          </Typography>
          <Typography variant="h5">Governed production progress</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 760 }}>
            Every stage stops at a deterministic review boundary. Approved, provenance-connected work advances; rejected or intentionally waived branches remain visible in governance history.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">{completedSteps}/{insights.steps.length} stages complete</Typography>
          <Chip size="small" label={insights.stage} color={insights.stage === 'COMPLETE' ? 'success' : 'primary'} variant="outlined" />
        </Stack>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={stepProgress}
        color={insights.stage === 'COMPLETE' ? 'success' : 'primary'}
        sx={{ mt: 2, height: 5, borderRadius: 999, bgcolor: '#EAF0F3' }}
      />

      <Box
        className="tital-horizontal-scroll"
        sx={{
          display: 'flex',
          overflowX: 'auto',
          gap: 0,
          mt: 2.25,
          pb: 0.75,
        }}
      >
        {insights.steps.map((step, index) => (
          <Stack key={step.stage} direction="row" sx={{ alignItems: 'center', flex: '0 0 auto' }}>
            <Stack spacing={0.65} sx={{ width: 120, alignItems: 'center', textAlign: 'center' }}>
              <StepDot status={step.status} />
              <Typography variant="caption" sx={{ fontWeight: step.status === 'CURRENT' ? 800 : 650, color: step.status === 'UPCOMING' ? 'text.secondary' : 'text.primary' }}>
                {step.label}
              </Typography>
            </Stack>
            {index < insights.steps.length - 1 && (
              <Box
                aria-hidden
                sx={{
                  width: 34,
                  height: 2,
                  bgcolor: step.status === 'COMPLETE' ? 'success.light' : 'divider',
                  mb: 2.3,
                  mx: -1,
                }}
              />
            )}
          </Stack>
        ))}
      </Box>

      {insights.blockedBy.length > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 750 }}>
            Human action required
          </Typography>
          <Typography variant="body2">
            {insights.blockedBy.join(', ')}
          </Typography>
        </Alert>
      )}

      <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' } }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 760 }}>
              Coverage integrity
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, maxWidth: 820 }}>
              Required branches stay connected to approved downstream work. Intentional omissions are explicit rather than silently regenerated.
            </Typography>
          </Box>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(245px, 1fr))',
            gap: 1.25,
            mt: 1.75,
          }}
        >
          {insights.coverage.map((coverage) => {
            const value = coverage.total === 0 ? 0 : (coverage.covered / coverage.total) * 100;
            return (
              <Card key={coverage.key} variant="outlined" sx={{ bgcolor: coverage.complete ? '#FBFDFC' : '#FFFFFF' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 760 }}>
                        {coverage.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {coverage.total === 0
                          ? 'Not active yet'
                          : `${coverage.covered} / ${coverage.total} ${coverage.parentLabel} resolved`}
                      </Typography>
                    </Box>
                    {coverage.total > 0 && (
                      <Chip
                        size="small"
                        label={coverage.complete ? 'Complete' : 'Needs attention'}
                        color={coverage.complete ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    )}
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={value}
                    color={coverage.complete ? 'success' : 'warning'}
                    sx={{ mt: 1.4, height: 6, borderRadius: 999, bgcolor: '#EAF0F3' }}
                  />

                  {coverage.waived > 0 && (
                    <Typography variant="caption" color="warning.dark" sx={{ display: 'block', mt: 1.2 }}>
                      {coverage.waived} branch{coverage.waived === 1 ? '' : 'es'} intentionally waived by human review.
                    </Typography>
                  )}

                  {coverage.missingParentIds.length > 0 && (
                    <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1.2 }}>
                      Missing {coverage.childLabel}: {coverage.missingParentIds.length} unresolved parent{coverage.missingParentIds.length === 1 ? '' : 's'}.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
}
