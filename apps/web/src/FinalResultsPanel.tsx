import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
import type { GateRecord, ProductionPackage } from './api';

function valueAsString(record: GateRecord, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

function recordTitle(record: GateRecord): string {
  return (
    valueAsString(record, 'title') ??
    valueAsString(record, 'question') ??
    valueAsString(record, 'text') ??
    valueAsString(record, 'description') ??
    valueAsString(record, 'decision') ??
    valueAsString(record, 'excerpt') ??
    record.id
  );
}

function RecordList({ records }: { records: GateRecord[] }) {
  if (records.length === 0) {
    return <Typography color="text.secondary">No approved records in this section.</Typography>;
  }

  return (
    <Stack spacing={1}>
      {records.map((record) => (
        <Card key={record.id} variant="outlined">
          <CardContent sx={{ '&:last-child': { pb: 2 } }}>
            <Typography sx={{ fontWeight: 700 }}>{recordTitle(record)}</Typography>
            <Typography variant="caption" color="text.secondary">
              {record.id}
            </Typography>
            <Box
              component="pre"
              sx={{
                mt: 1,
                mb: 0,
                p: 1.25,
                borderRadius: 1,
                bgcolor: 'grey.100',
                fontSize: 12,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
              }}
            >
              {JSON.stringify(record, null, 2)}
            </Box>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

function downloadPackage(pkg: ProductionPackage): void {
  const blob = new Blob([JSON.stringify(pkg, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `tital-production-package-${pkg.generatedAt.replace(/[:.]/g, '-')}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function FinalResultsPanel({
  productionPackage,
}: {
  productionPackage: ProductionPackage | null;
}) {
  if (!productionPackage) return null;

  const sections: Array<[string, GateRecord[]]> = [
    ['Research Questions', productionPackage.researchQuestions],
    ['Sources', productionPackage.sources],
    ['Evidence', productionPackage.evidence],
    ['Claims', productionPackage.claims],
    ['Scientific Script', productionPackage.scriptLines],
    ['Scenes', productionPackage.scenes],
    ['Shots', productionPackage.shots],
    ['Visual Decisions', productionPackage.visualDecisions],
  ];

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' } }}
      >
        <Box>
          <Typography variant="overline" color="text.secondary">
            Final results
          </Typography>
          <Typography variant="h5">Production Package</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Generated {new Date(productionPackage.generatedAt).toLocaleString()}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Chip
            label={productionPackage.status}
            color={productionPackage.status === 'READY_FOR_PRODUCTION' ? 'success' : 'warning'}
          />
          <Button variant="outlined" onClick={() => downloadPackage(productionPackage)}>
            Download JSON
          </Button>
        </Stack>
      </Stack>

      <Alert
        severity={productionPackage.audit.passed ? 'success' : 'error'}
        sx={{ mt: 2 }}
      >
        Scientific audit {productionPackage.audit.passed ? 'passed' : 'did not pass'} with{' '}
        {productionPackage.audit.issues.length} issue{productionPackage.audit.issues.length === 1 ? '' : 's'}.
      </Alert>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 1,
          mt: 2,
        }}
      >
        {sections.map(([label, records]) => (
          <Card key={label} variant="outlined">
            <CardContent sx={{ '&:last-child': { pb: 2 } }}>
              <Typography variant="body2" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                {records.length}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Accordion defaultExpanded sx={{ mt: 2 }}>
        <AccordionSummary>
          <Typography sx={{ fontWeight: 700 }}>Film Brief</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <RecordList records={[productionPackage.filmBrief]} />
        </AccordionDetails>
      </Accordion>

      {sections.map(([label, records]) => (
        <Accordion key={label}>
          <AccordionSummary>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 700 }}>{label}</Typography>
              <Chip size="small" label={records.length} variant="outlined" />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <RecordList records={records} />
          </AccordionDetails>
        </Accordion>
      ))}

      <Accordion>
        <AccordionSummary>
          <Typography sx={{ fontWeight: 700 }}>Scientific Audit</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {productionPackage.audit.issues.length === 0 ? (
            <Alert severity="success">No audit issues were reported.</Alert>
          ) : (
            <Stack spacing={1}>
              {productionPackage.audit.issues.map((issue) => (
                <Alert
                  key={issue.id}
                  severity={issue.severity === 'HIGH' ? 'error' : issue.severity === 'MEDIUM' ? 'warning' : 'info'}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {issue.code} · {issue.recordType} · {issue.recordId}
                  </Typography>
                  <Typography variant="body2">{issue.message}</Typography>
                </Alert>
              ))}
            </Stack>
          )}
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
}
