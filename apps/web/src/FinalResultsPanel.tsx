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
import { useState } from 'react';
import type { GateRecord, ProductionPackage } from './api';
import { ReadableRecord, type RecordKind } from './ReadableRecord';
import {
  downloadJsonPackage,
  downloadTextReport,
  printProductionReport,
} from './reportExport';

function RecordList({
  records,
  kind,
}: {
  records: GateRecord[];
  kind: RecordKind;
}) {
  if (records.length === 0) {
    return (
      <Typography color="text.secondary">
        No approved records in this section.
      </Typography>
    );
  }

  return (
    <Stack spacing={1.25}>
      {records.map((record, index) => (
        <Card key={record.id} variant="outlined">
          <CardContent sx={{ '&:last-child': { pb: 2 } }}>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ display: 'block', mb: 0.5 }}
            >
              {kind === 'scriptLine'
                ? `Script line ${index + 1}`
                : kind === 'visualDecision'
                  ? `Visual decision ${index + 1}`
                  : `${kind.replace(/([A-Z])/g, ' $1')} ${index + 1}`}
            </Typography>
            <ReadableRecord record={record} kind={kind} showId={false} />
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

export function FinalResultsPanel({
  productionPackage,
}: {
  productionPackage: ProductionPackage | null;
}) {
  const [reportError, setReportError] = useState<string | null>(null);

  if (!productionPackage) return null;

  const sections: Array<[string, RecordKind, GateRecord[]]> = [
    ['Research Questions', 'researchQuestion', productionPackage.researchQuestions],
    ['Sources', 'source', productionPackage.sources],
    ['Evidence', 'evidence', productionPackage.evidence],
    ['Claims', 'claim', productionPackage.claims],
    ['Scientific Script', 'scriptLine', productionPackage.scriptLines],
    ['Scenes', 'scene', productionPackage.scenes],
    ['Shots', 'shot', productionPackage.shots],
    ['Visual Decisions', 'visualDecision', productionPackage.visualDecisions],
  ];

  function handlePrint(): void {
    setReportError(null);
    if (!printProductionReport(productionPackage)) {
      setReportError(
        'The browser blocked the report window. Allow pop-ups for this local Tital page and try again.'
      );
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
        }}
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
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ alignItems: 'center', flexWrap: 'wrap' }}
        >
          <Chip
            label={productionPackage.status}
            color={
              productionPackage.status === 'READY_FOR_PRODUCTION'
                ? 'success'
                : 'warning'
            }
          />
          <Button variant="contained" onClick={handlePrint}>
            Print / Save PDF
          </Button>
          <Button
            variant="outlined"
            onClick={() => downloadTextReport(productionPackage)}
          >
            Download text
          </Button>
          <Button
            variant="text"
            onClick={() => downloadJsonPackage(productionPackage)}
          >
            Download JSON
          </Button>
        </Stack>
      </Stack>

      {reportError && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {reportError}
        </Alert>
      )}

      <Alert
        severity={productionPackage.audit.passed ? 'success' : 'error'}
        sx={{ mt: 2 }}
      >
        Scientific audit {productionPackage.audit.passed ? 'passed' : 'did not pass'} with{' '}
        {productionPackage.audit.issues.length} issue
        {productionPackage.audit.issues.length === 1 ? '' : 's'}.
      </Alert>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 1,
          mt: 2,
        }}
      >
        {sections.map(([label, , records]) => (
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
          <ReadableRecord
            record={productionPackage.filmBrief}
            kind="filmBrief"
            showId={false}
          />
        </AccordionDetails>
      </Accordion>

      {sections.map(([label, kind, records]) => (
        <Accordion key={label}>
          <AccordionSummary>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center' }}
            >
              <Typography sx={{ fontWeight: 700 }}>{label}</Typography>
              <Chip size="small" label={records.length} variant="outlined" />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <RecordList records={records} kind={kind} />
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
                  severity={
                    issue.severity === 'HIGH'
                      ? 'error'
                      : issue.severity === 'MEDIUM'
                        ? 'warning'
                        : 'info'
                  }
                >
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {issue.code} · {issue.recordType}
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
