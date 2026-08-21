import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import type { GateRecord, ProductionPackage } from './api';

interface TraceNode {
  label: string;
  value: string;
  tone: 'evidence' | 'story' | 'visual';
}

function stringField(record: GateRecord | undefined, key: string): string | null {
  if (!record) return null;
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function firstStringId(record: GateRecord | undefined, key: string): string | null {
  if (!record) return null;
  const value = record[key];
  if (!Array.isArray(value)) return null;
  return value.find((item): item is string => typeof item === 'string' && item.length > 0) ?? null;
}

function trim(value: string, limit = 150): string {
  return value.length <= limit ? value : `${value.slice(0, limit - 1).trimEnd()}…`;
}

function buildTrace(pkg: ProductionPackage): TraceNode[] {
  const visual = pkg.visualDecisions[0];
  const shotId = stringField(visual, 'shotId');
  const shot = pkg.shots.find((record) => record.id === shotId);
  const sceneId = stringField(shot, 'sceneId');
  const scene = pkg.scenes.find((record) => record.id === sceneId);
  const scriptLineId = firstStringId(scene, 'scriptLineIds') ?? firstStringId(shot, 'scriptLineIds');
  const scriptLine = pkg.scriptLines.find((record) => record.id === scriptLineId);
  const claimId = firstStringId(scriptLine, 'claimIds');
  const claim = pkg.claims.find((record) => record.id === claimId);
  const evidenceId = firstStringId(claim, 'evidenceIds');
  const evidence = pkg.evidence.find((record) => record.id === evidenceId);
  const sourceId = stringField(evidence, 'sourceId');
  const source = pkg.sources.find((record) => record.id === sourceId);

  const candidates: Array<TraceNode | null> = [
    source
      ? {
          label: 'Source',
          value: trim(stringField(source, 'title') ?? stringField(source, 'url') ?? 'Approved scientific source'),
          tone: 'evidence',
        }
      : null,
    evidence
      ? {
          label: 'Evidence',
          value: trim(stringField(evidence, 'interpretation') ?? stringField(evidence, 'excerpt') ?? 'Approved evidence record'),
          tone: 'evidence',
        }
      : null,
    claim
      ? {
          label: 'Claim',
          value: trim(stringField(claim, 'text') ?? 'Approved scientific claim'),
          tone: 'evidence',
        }
      : null,
    scriptLine
      ? {
          label: 'Script',
          value: trim(stringField(scriptLine, 'text') ?? 'Approved script line'),
          tone: 'story',
        }
      : null,
    scene
      ? {
          label: 'Scene',
          value: trim(stringField(scene, 'title') ?? stringField(scene, 'purpose') ?? 'Approved scene'),
          tone: 'story',
        }
      : null,
    shot
      ? {
          label: 'Shot',
          value: trim(stringField(shot, 'description') ?? 'Approved shot'),
          tone: 'visual',
        }
      : null,
    visual
      ? {
          label: 'Visual decision',
          value: trim(stringField(visual, 'decision') ?? 'Approved governed visual decision'),
          tone: 'visual',
        }
      : null,
  ];

  return candidates.filter((node): node is TraceNode => Boolean(node));
}

const TONE_STYLES = {
  evidence: { border: '#96C6C0', bg: '#F1F9F7', accent: '#23766F' },
  story: { border: '#E4C69F', bg: '#FFF8EF', accent: '#9B631B' },
  visual: { border: '#AEC4D3', bg: '#F2F7FA', accent: '#2C6D98' },
} as const;

export function EvidenceStoryTrace({ productionPackage }: { productionPackage: ProductionPackage }) {
  const nodes = buildTrace(productionPackage);
  if (nodes.length < 3) return null;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2.25, md: 3 },
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F7FAFB 100%)',
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { md: 'flex-end' } }}>
        <Box sx={{ maxWidth: 760 }}>
          <Chip size="small" label="Evidence → Story trace" color="secondary" variant="outlined" />
          <Typography variant="h5" sx={{ mt: 1.25 }}>Why does this visual exist?</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            Follow one approved production decision backwards through the governed chain. Tital keeps the creative result connected to the scientific material that justified it.
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Example trace from this completed project
        </Typography>
      </Stack>

      <Box
        className="tital-horizontal-scroll"
        sx={{
          display: 'flex',
          gap: 1.25,
          overflowX: 'auto',
          pb: 1,
          mt: 2.5,
          scrollSnapType: 'x proximity',
        }}
      >
        {nodes.map((node, index) => {
          const style = TONE_STYLES[node.tone];
          return (
            <Stack key={`${node.label}-${index}`} direction="row" spacing={1.25} sx={{ alignItems: 'center', flex: '0 0 auto' }}>
              <Paper
                variant="outlined"
                sx={{
                  width: { xs: 235, md: 250 },
                  minHeight: 150,
                  p: 2,
                  borderColor: style.border,
                  bgcolor: style.bg,
                  scrollSnapAlign: 'start',
                }}
              >
                <Typography variant="overline" sx={{ color: style.accent }}>
                  {node.label}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.75, fontWeight: 650, lineHeight: 1.55 }}>
                  {node.value}
                </Typography>
              </Paper>
              {index < nodes.length - 1 && (
                <Box aria-hidden sx={{ color: 'text.secondary', fontSize: 24, opacity: 0.62 }}>
                  →
                </Box>
              )}
            </Stack>
          );
        })}
      </Box>
    </Paper>
  );
}
