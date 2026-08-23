import { Alert, Chip, Paper, Stack, Typography } from '@mui/material';
import type { GateRecord, SessionView } from './api';

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
  if (evidence.length === 0) return null;
  const grounded = evidence.filter(isFullSourceGrounded).length;
  const legacy = evidence.length - grounded;

  return (
    <Paper variant="outlined" sx={{ p: 2.25 }}>
      <Typography variant="overline" color="text.secondary">Evidence grounding</Typography>
      <Typography variant="h6">Full-source retrieval</Typography>
      <Stack direction="row" spacing={0.7} useFlexGap sx={{ mt: 1, flexWrap: 'wrap' }}>
        <Chip size="small" color={grounded === evidence.length ? 'success' : 'primary'} label={`${grounded}/${evidence.length} Parallel web_fetch`} />
        {legacy > 0 && <Chip size="small" variant="outlined" color="warning" label={`${legacy} legacy excerpt-grounded`} />}
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        New evidence is extracted only after Gemini calls Parallel <strong>web_fetch</strong> on the exact human-approved source URL. Search snippets remain discovery context and are not treated as the evidence basis.
      </Typography>
      {legacy > 0 && (
        <Alert severity="info" variant="outlined" sx={{ mt: 1.25 }}>
          Older project records can remain excerpt-grounded for backward compatibility. Regenerated evidence uses full-source grounding.
        </Alert>
      )}
    </Paper>
  );
}
