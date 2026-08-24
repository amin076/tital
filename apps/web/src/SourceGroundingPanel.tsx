import { Alert, Chip, Divider, Paper, Stack, Typography } from '@mui/material';
import type { GateRecord, SessionView } from './api';

interface EvidenceBudgetView {
  mode: 'AUTO';
  durationMinutes: number;
  candidateCount: number;
  promotedCount: number;
  archivedCount: number;
  approvedCount: number;
  targetBudget: number;
  reductionPercent: number;
}

function isFullSourceGrounded(record: GateRecord): boolean {
  const grounding = record.grounding;
  if (!grounding || typeof grounding !== 'object' || Array.isArray(grounding)) return false;
  const value = grounding as Record<string, unknown>;
  return value.mode === 'PARALLEL_WEB_FETCH' && value.discoveryExcerptUsedAsGrounding === false;
}

export function SourceGroundingPanel({ view }: { view: SessionView }) {
  const pendingEvidence = view.gate?.recordType === 'EvidenceRecord'
    ? view.gate.records
    : [];
  const evidence = [...view.approvedChain.evidence, ...pendingEvidence];
  const evidenceBudget = (view as SessionView & { evidenceBudget?: EvidenceBudgetView }).evidenceBudget;
  if (evidence.length === 0 && !evidenceBudget?.candidateCount) return null;
  const grounded = evidence.filter(isFullSourceGrounded).length;
  const legacy = evidence.length - grounded;
  const activeForHuman = (evidenceBudget?.promotedCount ?? 0) + (evidenceBudget?.approvedCount ?? 0);

  return (
    <Paper variant="outlined" sx={{ p: 2.25 }}>
      <Typography variant="overline" color="text.secondary">Evidence grounding</Typography>
      <Typography variant="h6">Full-source retrieval</Typography>
      {evidence.length > 0 && (
        <>
          <Stack direction="row" spacing={0.7} useFlexGap sx={{ mt: 1, flexWrap: 'wrap' }}>
            <Chip size="small" color={grounded === evidence.length ? 'success' : 'primary'} label={`${grounded}/${evidence.length} active Parallel web_fetch`} />
            {legacy > 0 && <Chip size="small" variant="outlined" color="warning" label={`${legacy} legacy excerpt-grounded`} />}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            New evidence is extracted only after Gemini calls Parallel <strong>web_fetch</strong> on the exact human-approved source URL. Search snippets remain discovery context and are not treated as the evidence basis.
          </Typography>
        </>
      )}

      {evidenceBudget && evidenceBudget.candidateCount > 0 && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="overline" color="secondary.dark">Human attention budget</Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 750 }}>Rich research, compact production evidence</Typography>
          <Stack direction="row" spacing={0.7} useFlexGap sx={{ mt: 0.9, flexWrap: 'wrap' }}>
            <Chip size="small" label={`${evidenceBudget.candidateCount} research candidates`} variant="outlined" />
            <Chip size="small" color="success" label={`${activeForHuman} active / approved`} variant="outlined" />
            <Chip size="small" color="default" label={`${evidenceBudget.archivedCount} archived`} variant="outlined" />
            <Chip size="small" label={`Auto target ${evidenceBudget.targetBudget}`} variant="outlined" />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.9 }}>
            Tital keeps non-promoted evidence in the project research archive instead of deleting it. Only the duration- and research-priority-aware subset enters AI-assisted human review and the trusted downstream production chain.
          </Typography>
          {evidenceBudget.archivedCount > 0 && (
            <Alert severity="info" variant="outlined" sx={{ mt: 1.1 }}>
              {evidenceBudget.reductionPercent}% of the current research evidence pool is preserved outside the active human-review workload.
            </Alert>
          )}
        </>
      )}

      {legacy > 0 && (
        <Alert severity="info" variant="outlined" sx={{ mt: 1.25 }}>
          Older project records can remain excerpt-grounded for backward compatibility. Regenerated evidence uses full-source grounding.
        </Alert>
      )}
    </Paper>
  );
}
