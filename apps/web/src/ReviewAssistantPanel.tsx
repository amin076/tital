import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import type {
  GateRecord,
  ReviewGate,
  ReviewRecommendation,
} from './api';

function recordSummary(record: GateRecord | undefined): string {
  if (!record) return 'Unknown candidate';
  const values = [record.title, record.interpretation, record.excerpt, record.question];
  const value = values.find((candidate) => typeof candidate === 'string' && candidate.trim().length > 0);
  return typeof value === 'string' ? value : record.id;
}

function attentionOrder(attention: ReviewRecommendation['attention']): number {
  if (attention === 'HIGH') return 0;
  if (attention === 'MEDIUM') return 1;
  return 2;
}

function recommendationLabel(value: ReviewRecommendation['recommendation']): string {
  if (value === 'APPROVE_SUGGESTED') return 'Approve suggested';
  if (value === 'REJECT_SUGGESTED') return 'Reject suggested';
  return 'Review required';
}

export function ReviewAssistantPanel({
  gate,
  recommendations,
  busy,
  onRun,
  onSelectIds,
}: {
  gate: ReviewGate;
  recommendations: ReviewRecommendation[];
  busy: boolean;
  onRun: () => void;
  onSelectIds: (ids: string[]) => void;
}) {
  const [attentionOnly, setAttentionOnly] = useState(false);
  const supported = gate.recordType === 'SourceRecord' || gate.recordType === 'EvidenceRecord';
  const pendingIds = useMemo(() => new Set(gate.records.map((record) => record.id)), [gate.records]);
  const current = useMemo(
    () => recommendations
      .filter((recommendation) => pendingIds.has(recommendation.targetRecordId))
      .sort((a, b) => attentionOrder(a.attention) - attentionOrder(b.attention)),
    [pendingIds, recommendations]
  );

  if (!supported) return null;

  const counts = current.reduce(
    (result, recommendation) => {
      result[recommendation.attention] += 1;
      return result;
    },
    { LOW: 0, MEDIUM: 0, HIGH: 0 }
  );
  const visible = attentionOnly
    ? current.filter((recommendation) => recommendation.attention !== 'LOW')
    : current;
  const suggestedApprovalIds = current
    .filter((recommendation) => recommendation.recommendation === 'APPROVE_SUGGESTED')
    .map((recommendation) => recommendation.targetRecordId);
  const highAttentionIds = current
    .filter((recommendation) => recommendation.attention === 'HIGH')
    .map((recommendation) => recommendation.targetRecordId);

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.25}
        sx={{ justifyContent: 'space-between', alignItems: { md: 'flex-start' } }}
      >
        <Box>
          <Typography variant="overline" color="secondary.dark">AI review assistant</Typography>
          <Typography variant="h6">Focus human attention where it matters</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 780 }}>
            Gemini independently evaluates the pending candidates and explains risk. Recommendations are advisory only; they never change trusted approval or rejection status.
          </Typography>
        </Box>
        <Button variant={current.length ? 'outlined' : 'contained'} disabled={busy} onClick={onRun}>
          {current.length ? 'Refresh AI review' : 'Ask Gemini to review'}
        </Button>
      </Stack>

      {current.length === 0 ? (
        <Alert severity="info" variant="outlined" sx={{ mt: 1.75 }}>
          No AI recommendations are stored for this gate yet. Manual review remains fully available.
        </Alert>
      ) : (
        <>
          <Stack direction="row" spacing={0.75} useFlexGap sx={{ mt: 1.75, flexWrap: 'wrap' }}>
            <Chip label={`${counts.HIGH} high attention`} color={counts.HIGH ? 'error' : 'default'} variant="outlined" />
            <Chip label={`${counts.MEDIUM} medium`} color={counts.MEDIUM ? 'warning' : 'default'} variant="outlined" />
            <Chip label={`${counts.LOW} low`} color={counts.LOW ? 'success' : 'default'} variant="outlined" />
            <Chip label={`${current.length} reviewed by AI`} variant="outlined" />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.75} useFlexGap sx={{ mt: 1.25, flexWrap: 'wrap' }}>
            <Button size="small" variant={attentionOnly ? 'contained' : 'text'} onClick={() => setAttentionOnly((value) => !value)}>
              {attentionOnly ? 'Show all recommendations' : 'Show what needs attention'}
            </Button>
            <Button size="small" disabled={suggestedApprovalIds.length === 0} onClick={() => onSelectIds(suggestedApprovalIds)}>
              Select suggested approvals ({suggestedApprovalIds.length})
            </Button>
            <Button size="small" disabled={highAttentionIds.length === 0} onClick={() => onSelectIds(highAttentionIds)}>
              Select high-attention ({highAttentionIds.length})
            </Button>
          </Stack>

          <Stack spacing={1} sx={{ mt: 1.4 }}>
            {visible.map((recommendation) => {
              const record = gate.records.find((candidate) => candidate.id === recommendation.targetRecordId);
              return (
                <Card key={recommendation.id} variant="outlined">
                  <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.8} sx={{ justifyContent: 'space-between' }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ overflowWrap: 'anywhere' }}>
                          {recordSummary(record)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {recommendation.targetRecordId} · confidence {Math.round(recommendation.confidence * 100)}%
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={0.6} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        <Chip size="small" label={recommendation.attention} color={recommendation.attention === 'HIGH' ? 'error' : recommendation.attention === 'MEDIUM' ? 'warning' : 'success'} />
                        <Chip size="small" label={recommendationLabel(recommendation.recommendation)} variant="outlined" />
                      </Stack>
                    </Stack>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {recommendation.reasons.join(' · ')}
                    </Typography>
                    {recommendation.risks.length > 0 && (
                      <Typography variant="body2" color="warning.dark" sx={{ mt: 0.65 }}>
                        Risks: {recommendation.risks.join(' · ')}
                      </Typography>
                    )}
                    {recommendation.flags.length > 0 && (
                      <Stack direction="row" spacing={0.5} useFlexGap sx={{ mt: 0.8, flexWrap: 'wrap' }}>
                        {recommendation.flags.map((flag) => <Chip key={flag} size="small" label={flag.replaceAll('_', ' ')} variant="outlined" />)}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        </>
      )}
    </Paper>
  );
}
