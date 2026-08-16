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

export function WorkflowInsightsPanel({
  insights,
}: {
  insights: WorkflowInsights;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Typography variant="overline" color="text.secondary">
        Workflow clarity
      </Typography>
      <Typography variant="h6">Progress and coverage</Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: 1,
          mt: 2,
        }}
      >
        {insights.steps.map((step) => (
          <Card
            key={step.stage}
            variant="outlined"
            sx={{
              borderColor:
                step.status === 'CURRENT'
                  ? 'primary.main'
                  : step.status === 'COMPLETE'
                    ? 'success.light'
                    : 'divider',
            }}
          >
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {step.label}
              </Typography>
              <Chip
                size="small"
                sx={{ mt: 1 }}
                label={
                  step.status === 'COMPLETE'
                    ? 'Done'
                    : step.status === 'CURRENT'
                      ? 'Current'
                      : 'Upcoming'
                }
                color={
                  step.status === 'COMPLETE'
                    ? 'success'
                    : step.status === 'CURRENT'
                      ? 'primary'
                      : 'default'
                }
                variant={step.status === 'UPCOMING' ? 'outlined' : 'filled'}
              />
            </CardContent>
          </Card>
        ))}
      </Box>

      {insights.blockedBy.length > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Current blocker{insights.blockedBy.length > 1 ? 's' : ''}
          </Typography>
          <Typography variant="body2">
            {insights.blockedBy.join(', ')}
          </Typography>
        </Alert>
      )}

      <Typography variant="subtitle1" sx={{ mt: 2.5, fontWeight: 700 }}>
        Approved-chain coverage
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        A stage advances when every approved parent record has at least one approved,
        provenance-connected child record.
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 1.25,
          mt: 1.5,
        }}
      >
        {insights.coverage.map((coverage) => {
          const value = coverage.total === 0 ? 0 : (coverage.covered / coverage.total) * 100;
          return (
            <Card key={coverage.key} variant="outlined">
              <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {coverage.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {coverage.total === 0
                        ? 'Not active yet'
                        : `${coverage.covered} of ${coverage.total} ${coverage.parentLabel} covered`}
                    </Typography>
                  </Box>
                  {coverage.total > 0 && (
                    <Chip
                      size="small"
                      label={coverage.complete ? 'Complete' : 'Incomplete'}
                      color={coverage.complete ? 'success' : 'warning'}
                      variant="outlined"
                    />
                  )}
                </Stack>

                <LinearProgress
                  variant="determinate"
                  value={value}
                  color={coverage.complete ? 'success' : 'primary'}
                  sx={{ mt: 1.25, height: 7, borderRadius: 8 }}
                />

                {coverage.missingParentIds.length > 0 && (
                  <Box sx={{ mt: 1.25 }}>
                    <Typography variant="caption" color="warning.main">
                      Missing {coverage.childLabel} for:
                    </Typography>
                    <Stack direction="row" spacing={0.5} useFlexGap sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                      {coverage.missingParentIds.slice(0, 6).map((id) => (
                        <Chip key={id} size="small" label={id} variant="outlined" />
                      ))}
                      {coverage.missingParentIds.length > 6 && (
                        <Chip
                          size="small"
                          label={`+${coverage.missingParentIds.length - 6} more`}
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Paper>
  );
}
