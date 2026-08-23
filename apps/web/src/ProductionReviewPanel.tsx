import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
  type AlertColor,
} from '@mui/material';
import { assistReview, type SessionView } from './api';

interface ProductionReviewFinding {
  id: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  targetType: string;
  targetRecordId: string | null;
  title: string;
  message: string;
  rationale: string;
  suggestedAction: string;
  confidence: number;
}

interface ProductionReviewReport {
  id: string;
  productionPackageGeneratedAt: string;
  createdAt: string;
  model: string;
  summary: string;
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  findings: ProductionReviewFinding[];
  advisoryOnly: true;
}

type SessionWithProductionReviews = SessionView & {
  productionReviews?: ProductionReviewReport[];
};

function severityColor(severity: ProductionReviewFinding['severity']): AlertColor {
  if (severity === 'HIGH') return 'error';
  if (severity === 'MEDIUM') return 'warning';
  return 'info';
}

function severityOrder(severity: ProductionReviewFinding['severity']): number {
  if (severity === 'HIGH') return 0;
  if (severity === 'MEDIUM') return 1;
  return 2;
}

function latestCurrentReport(view: SessionWithProductionReviews): ProductionReviewReport | null {
  const generatedAt = view.productionPackage?.generatedAt;
  if (!generatedAt) return null;
  return [...(view.productionReviews ?? [])]
    .reverse()
    .find((report) => report.productionPackageGeneratedAt === generatedAt) ?? null;
}

export function ProductionReviewPanel({
  view,
  busy,
  onBusyChange,
  onUpdated,
  onError,
}: {
  view: SessionView;
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
  onUpdated: (view: SessionView) => void;
  onError: (message: string | null) => void;
}) {
  const extended = view as SessionWithProductionReviews;
  const report = latestCurrentReport(extended);
  const findings = [...(report?.findings ?? [])].sort(
    (a, b) => severityOrder(a.severity) - severityOrder(b.severity)
  );

  async function runReview(): Promise<void> {
    onBusyChange(true);
    onError(null);
    try {
      const next = await assistReview(view.summary.sessionId);
      onUpdated(next);
    } catch (cause: unknown) {
      onError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      onBusyChange(false);
    }
  }

  if (view.summary.stage !== 'COMPLETE' || !view.productionPackage) return null;

  return (
    <Paper variant="outlined" sx={{ p: 2.25, borderColor: 'rgba(52,93,117,0.28)' }}>
      <Typography variant="overline" color="secondary.dark">AI final review</Typography>
      <Typography variant="h6">Independent production review</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.65 }}>
        Gemini reviews the completed package for semantic scientific drift, uncertainty loss, narrative/pacing issues, visual-integrity risks, audience fit, and Director Brief alignment. It is advisory only and cannot change an approval or production record.
      </Typography>

      <Alert severity="info" variant="outlined" sx={{ mt: 1.35 }}>
        This does not certify scientific truth. It is a second-pass reviewer that helps you decide where human attention or a governed revision is useful.
      </Alert>

      <Button
        variant={report ? 'outlined' : 'contained'}
        disabled={busy}
        onClick={() => void runReview()}
        sx={{ mt: 1.4 }}
      >
        {busy ? 'Reviewing…' : report ? 'Run review again' : 'Review final production with AI'}
      </Button>

      {report && (
        <Box sx={{ mt: 1.75 }}>
          <Divider sx={{ mb: 1.5 }} />
          <Stack direction="row" spacing={0.75} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip
              size="small"
              label={`${report.overallRisk} overall risk`}
              color={report.overallRisk === 'HIGH' ? 'error' : report.overallRisk === 'MEDIUM' ? 'warning' : 'info'}
            />
            <Chip size="small" variant="outlined" label={`${findings.length} finding${findings.length === 1 ? '' : 's'}`} />
            <Typography variant="caption" color="text.secondary">
              {new Date(report.createdAt).toLocaleString()} · {report.model}
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 1.1, lineHeight: 1.6 }}>
            {report.summary}
          </Typography>

          {findings.length === 0 ? (
            <Alert severity="success" sx={{ mt: 1.4 }}>
              The advisory reviewer reported no material semantic concern in the supplied package. Human final judgment still applies.
            </Alert>
          ) : (
            <Stack spacing={1} sx={{ mt: 1.4 }}>
              {findings.map((finding) => (
                <Card key={finding.id} variant="outlined">
                  <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                    <Stack direction="row" spacing={0.7} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                      <Chip size="small" color={severityColor(finding.severity)} label={finding.severity} />
                      <Chip size="small" variant="outlined" label={finding.category.replaceAll('_', ' ')} />
                      <Typography variant="caption" color="text.secondary">
                        {finding.targetType}{finding.targetRecordId ? ` · ${finding.targetRecordId}` : ''}
                      </Typography>
                    </Stack>
                    <Typography variant="subtitle2" sx={{ mt: 0.9 }}>{finding.title}</Typography>
                    <Typography variant="body2" sx={{ mt: 0.45 }}>{finding.message}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.65 }}>
                      <strong>Why:</strong> {finding.rationale}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45 }}>
                      <strong>Suggested action:</strong> {finding.suggestedAction}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.7 }}>
                      Reviewer confidence {(finding.confidence * 100).toFixed(0)}%. Use Governed Revision to make any change; this finding does not mutate trusted state.
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      )}
    </Paper>
  );
}
