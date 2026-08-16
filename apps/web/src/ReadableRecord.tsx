import {
  Box,
  Chip,
  Divider,
  Link,
  Stack,
  Typography,
  type ChipProps,
} from '@mui/material';
import type { GateRecord } from './api';

export type RecordKind =
  | 'filmBrief'
  | 'researchQuestion'
  | 'source'
  | 'evidence'
  | 'claim'
  | 'scriptLine'
  | 'scene'
  | 'shot'
  | 'visualDecision'
  | 'generic';

export function recordKindFromGateType(recordType: string): RecordKind {
  switch (recordType) {
    case 'FilmBrief':
      return 'filmBrief';
    case 'ResearchQuestion':
      return 'researchQuestion';
    case 'SourceRecord':
      return 'source';
    case 'EvidenceRecord':
      return 'evidence';
    case 'ClaimRecord':
      return 'claim';
    case 'ScriptLineRecord':
      return 'scriptLine';
    case 'SceneRecord':
      return 'scene';
    case 'ShotRecord':
      return 'shot';
    case 'VisualDecisionRecord':
      return 'visualDecision';
    default:
      return 'generic';
  }
}

function stringValue(record: GateRecord, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

function numberValue(record: GateRecord, key: string): number | null {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function stringArray(record: GateRecord, key: string): string[] {
  const value = record[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function statusColor(status: string | null): ChipProps['color'] {
  if (status === 'APPROVED' || status === 'LOCKED') return 'success';
  if (status === 'REJECTED') return 'error';
  if (status === 'REVIEW_REQUIRED' || status === 'DISCOVERED') return 'warning';
  return 'default';
}

function labelize(key: string): string {
  return key
    .replace(/Id$/, ' ID')
    .replace(/Ids$/, ' IDs')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (letter) => letter.toUpperCase());
}

function MetaChip({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return <Chip size="small" variant="outlined" label={`${label}: ${value}`} />;
}

function Field({ label, value }: { label: string; value: string | number | null }) {
  if (value === null || value === '') return null;
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
        {label}
      </Typography>
      <Typography sx={{ lineHeight: 1.65 }}>{value}</Typography>
    </Box>
  );
}

function ListField({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) return null;
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Box component="ul" sx={{ my: 0, pl: 2.5 }}>
        {values.map((value, index) => (
          <Typography component="li" key={`${label}-${index}`} sx={{ mb: 0.5, lineHeight: 1.55 }}>
            {value}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

function Uncertainty({ value }: { value: string | null }) {
  if (!value) return null;
  return (
    <Box sx={{ p: 1.25, borderRadius: 1, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.25 }}>
        Uncertainty / limitation
      </Typography>
      <Typography variant="body2" sx={{ lineHeight: 1.55 }}>{value}</Typography>
    </Box>
  );
}

function RecordFooter({ record, showId }: { record: GateRecord; showId: boolean }) {
  const status = stringValue(record, 'status');
  return (
    <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
      {status && <Chip size="small" label={status} color={statusColor(status)} variant="outlined" />}
      {showId && (
        <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
          {record.id}
        </Typography>
      )}
    </Stack>
  );
}

function GenericRecord({ record, showId }: { record: GateRecord; showId: boolean }) {
  const hidden = new Set(['id', 'status']);
  const entries = Object.entries(record).filter(([key, value]) => !hidden.has(key) && value !== null && value !== '');
  return (
    <Stack spacing={1.25}>
      {entries.map(([key, value]) => {
        if (Array.isArray(value)) {
          return <ListField key={key} label={labelize(key)} values={value.filter((item): item is string => typeof item === 'string')} />;
        }
        if (typeof value === 'string' || typeof value === 'number') {
          return <Field key={key} label={labelize(key)} value={value} />;
        }
        return null;
      })}
      <RecordFooter record={record} showId={showId} />
    </Stack>
  );
}

export function ReadableRecord({
  record,
  kind,
  showId = true,
}: {
  record: GateRecord;
  kind: RecordKind;
  showId?: boolean;
}) {
  const status = stringValue(record, 'status');

  if (kind === 'filmBrief') {
    return (
      <Stack spacing={1.75}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 750 }}>
            {stringValue(record, 'title') ?? 'Film brief'}
          </Typography>
          <Stack direction="row" spacing={0.75} useFlexGap sx={{ mt: 0.75, flexWrap: 'wrap' }}>
            <MetaChip label="Topic" value={stringValue(record, 'scientificTopic')} />
            <MetaChip label="Audience" value={stringValue(record, 'targetAudience')} />
            <MetaChip label="Format" value={stringValue(record, 'format')} />
            {numberValue(record, 'durationMinutes') !== null && (
              <Chip size="small" variant="outlined" label={`${numberValue(record, 'durationMinutes')} min`} />
            )}
            {status && <Chip size="small" label={status} color={statusColor(status)} variant="outlined" />}
          </Stack>
        </Box>
        <Field label="Scientific question" value={stringValue(record, 'scientificQuestion')} />
        <Field label="Communication objective" value={stringValue(record, 'communicationObjective')} />
        <Field label="Audience knowledge level" value={stringValue(record, 'audienceKnowledgeLevel')} />
        <Field label="Tone" value={stringValue(record, 'tone')} />
        <Divider />
        <ListField label="Learning goals" values={stringArray(record, 'learningGoals')} />
        <ListField label="Scope" values={stringArray(record, 'scope')} />
        <ListField label="Out of scope" values={stringArray(record, 'outOfScope')} />
        <ListField label="Constraints" values={stringArray(record, 'constraints')} />
        <ListField label="Research requirements" values={stringArray(record, 'researchRequirements')} />
        {showId && <Typography variant="caption" color="text.secondary">{record.id}</Typography>}
      </Stack>
    );
  }

  if (kind === 'researchQuestion') {
    return (
      <Stack spacing={1.25}>
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.4 }}>
          {stringValue(record, 'question') ?? 'Research question'}
        </Typography>
        <Field label="Purpose" value={stringValue(record, 'purpose')} />
        <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <MetaChip label="Priority" value={stringValue(record, 'priority')} />
        </Stack>
        <RecordFooter record={record} showId={showId} />
      </Stack>
    );
  }

  if (kind === 'source') {
    const url = stringValue(record, 'url');
    return (
      <Stack spacing={1.25}>
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.4 }}>
          {stringValue(record, 'title') ?? 'Source'}
        </Typography>
        {url && (
          <Link href={url} target="_blank" rel="noreferrer" sx={{ overflowWrap: 'anywhere' }}>
            {url}
          </Link>
        )}
        <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <MetaChip label="Provider" value={stringValue(record, 'provider')} />
          <MetaChip label="Published" value={stringValue(record, 'publishDate')} />
        </Stack>
        <ListField label="Relevant excerpts" values={stringArray(record, 'excerpts')} />
        <RecordFooter record={record} showId={showId} />
      </Stack>
    );
  }

  if (kind === 'evidence') {
    const excerpt = stringValue(record, 'excerpt');
    return (
      <Stack spacing={1.25}>
        {excerpt && (
          <Box sx={{ pl: 1.5, py: 0.5, borderLeft: '4px solid', borderColor: 'primary.main' }}>
            <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.6 }}>{excerpt}</Typography>
          </Box>
        )}
        <Field label="Interpretation" value={stringValue(record, 'interpretation')} />
        <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <MetaChip label="Strength" value={stringValue(record, 'strength')} />
        </Stack>
        <Uncertainty value={stringValue(record, 'uncertainty')} />
        <RecordFooter record={record} showId={showId} />
      </Stack>
    );
  }

  if (kind === 'claim') {
    return (
      <Stack spacing={1.25}>
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.5 }}>
          {stringValue(record, 'text') ?? 'Claim'}
        </Typography>
        <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <MetaChip label="Confidence" value={stringValue(record, 'confidence')} />
        </Stack>
        <Uncertainty value={stringValue(record, 'uncertainty')} />
        <RecordFooter record={record} showId={showId} />
      </Stack>
    );
  }

  if (kind === 'scriptLine') {
    return (
      <Stack spacing={1.25}>
        <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'primary.50' }}>
          <Typography variant="h6" sx={{ fontWeight: 650, lineHeight: 1.55 }}>
            {stringValue(record, 'text') ?? 'Script line'}
          </Typography>
        </Box>
        <Uncertainty value={stringValue(record, 'uncertaintyDisclosure')} />
        <RecordFooter record={record} showId={showId} />
      </Stack>
    );
  }

  if (kind === 'scene') {
    return (
      <Stack spacing={1.25}>
        <Typography variant="h6" sx={{ fontWeight: 750 }}>
          {stringValue(record, 'title') ?? 'Scene'}
        </Typography>
        <Field label="Purpose" value={stringValue(record, 'purpose')} />
        <Field label="Visual summary" value={stringValue(record, 'visualSummary')} />
        <Uncertainty value={stringValue(record, 'uncertaintyDisclosure')} />
        <RecordFooter record={record} showId={showId} />
      </Stack>
    );
  }

  if (kind === 'shot') {
    return (
      <Stack spacing={1.25}>
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.45 }}>
          {stringValue(record, 'description') ?? 'Shot'}
        </Typography>
        <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <MetaChip label="Visual category" value={stringValue(record, 'visualIntegrityCategory')} />
        </Stack>
        <Field label="Camera direction" value={stringValue(record, 'cameraDirection')} />
        <Field label="Scientific constraint" value={stringValue(record, 'scientificConstraint')} />
        <Uncertainty value={stringValue(record, 'uncertaintyDisclosure')} />
        <RecordFooter record={record} showId={showId} />
      </Stack>
    );
  }

  if (kind === 'visualDecision') {
    return (
      <Stack spacing={1.25}>
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.45 }}>
          {stringValue(record, 'decision') ?? 'Visual decision'}
        </Typography>
        <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <MetaChip label="Category" value={stringValue(record, 'category')} />
          <MetaChip label="Risk" value={stringValue(record, 'riskLevel')} />
        </Stack>
        <Field label="Scientific constraint" value={stringValue(record, 'scientificConstraint')} />
        <Field label="Viewer disclosure" value={stringValue(record, 'disclosure')} />
        <RecordFooter record={record} showId={showId} />
      </Stack>
    );
  }

  return <GenericRecord record={record} showId={showId} />;
}
