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

function StepDot({ status, index }: { status: 'COMPLETE' | 'CURRENT' | 'UPCOMING'; index: number }) {
  const complete = status === 'COMPLETE';
  const current = status === 'CURRENT';
  return (
    <Box
      aria-hidden
      sx={{
        width: 30,
        height: 30,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        flex: '0 0 auto',
        fontSize: 12,
        fontWeight: 800,
        color: complete || current ? '#fff' : 'text.secondary',
        bgcolor: complete ? 'success.main' : current ? 'primary.main' : '#EEF2F4',
        border: current ? '3px solid #D9E8F0' : '1px solid',
        borderColor: complete ? 'success.main' : current ? 'primary.main' : 'divider',
      }}
    >
      {complete ? '✓' : current ? '•' : index + 1}
    </Box>
  );
}

export function WorkflowInsightsPanel({ insights }: { insights: WorkflowInsights }) {
  const completedSteps = insights.steps.filter((step) => step.status === 'COMPLETE').length;
  const stepProgress = insights.steps.length === 0 ? 0 : (completedSteps / insights.steps.length) * 100;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.25, md: 3 } }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { md: 'flex-end' } }}>
        <Box>
          <Typography variant="overline" color="text.secondary">Workflow clarity</Typography>
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
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(5, minmax(0, 1fr))' },
          gap: 1,
          mt: 2.25,
        }}
      >
        {insights.steps.map((step, index) => (
          <Box
            key={step.stage}
            sx={{
              minWidth: 0,
              p: 1.1,
              borderRadius: 2,
              border: '1px solid',
              borderColor: step.status === 'CURRENT' ? 'primary.main' : step.status === 'COMPLETE' ? 'rgba(47,125,74,0.25)' : 'divider',
              bgcolor: step.status === 'CURRENT' ? 'rgba(21,58,82,0.045)' : step.status === 'COMPLETE' ? 'rgba(47,125,74,0.035)' : '#fff',
            }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <StepDot status={step.status} index={index} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Stage {index + 1}</Typography>
                <Typography variant="body2" noWrap sx={{ fontWeight: step.status === 'CURRENT' ? 800 : 700, color: step.status === 'UPCOMING' ? 'text.secondary' : 'text.primary' }}>
                  {step.label}
                </Typography>
              </Box>
            </Stack>
          </Box>
        ))}
      </Box>

      {insights.blockedBy.length > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 750 }}>Human action required</Typography>
          <Typography variant="body2">{insights.blockedBy.join(', ')}</Typography>
        </Alert>
      )}

      <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 760 }}>Coverage integrity</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, maxWidth: 820 }}>
          Required branches stay connected to approved downstream work. Intentional omissions are explicit rather than silently regenerated.
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(235px, 1fr))', gap: 1.25, mt: 1.75 }}>
          {insights.coverage.map((coverage) => {
            const value = coverage.total === 0 ? 0 : (coverage.covered / coverage.total) * 100;
            return (
              <Card key={coverage.key} variant="outlined" sx={{ bgcolor: coverage.complete ? '#FBFDFC' : '#FFFFFF' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 760 }}>{coverage.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {coverage.total === 0 ? 'Not active yet' : `${coverage.covered} / ${coverage.total} ${coverage.parentLabel} resolved`}
                      </Typography>
                    </Box>
                    {coverage.total > 0 && (
                      <Chip size="small" label={coverage.complete ? 'Complete' : 'Needs attention'} color={coverage.complete ? 'success' : 'warning'} variant="outlined" />
                    )}
                  </Stack>
                  <LinearProgress variant="determinate" value={value} color={coverage.complete ? 'success' : 'warning'} sx={{ mt: 1.4, height: 6, borderRadius: 999, bgcolor: '#EAF0F3' }} />
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
