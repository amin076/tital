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
  Divider,
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

const AUDIT_SCOPE_NOTE =
  'This audit checks provenance links, upstream approvals, visual-category consistency, and required disclosures. It does not independently validate the scientific truth or authority of content that a human approved.';

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
  const pkg = productionPackage;

  const sections: Array<[string, RecordKind, GateRecord[]]> = [
    ['Research Questions', 'researchQuestion', pkg.researchQuestions],
    ['Sources', 'source', pkg.sources],
    ['Evidence', 'evidence', pkg.evidence],
    ['Claims', 'claim', pkg.claims],
    ['Scientific Script', 'scriptLine', pkg.scriptLines],
    ['Scenes', 'scene', pkg.scenes],
    ['Shots', 'shot', pkg.shots],
    ['Visual Decisions', 'visualDecision', pkg.visualDecisions],
  ];

  function handlePrint(): void {
    setReportError(null);
    if (!printProductionReport(pkg)) {
      setReportError(
        'The browser blocked the report window. Allow pop-ups for this local Tital page and try again.'
      );
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'flex-start' },
        }}
      >
        <Box>
          <Typography variant="overline" color="text.secondary">
            Final results
          </Typography>
          <Typography variant="h5">Production Package</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Generated {new Date(pkg.generatedAt).toLocaleString()}
          </Typography>
        </Box>
        <Chip
          label={pkg.status}
          color={pkg.status === 'READY_FOR_PRODUCTION' ? 'success' : 'warning'}
          sx={{ flexShrink: 0 }}
        />
      </Stack>

      <Divider sx={{ my: 1.75 }} />
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        useFlexGap
        sx={{ alignItems: { xs: 'stretch', sm: 'center' }, flexWrap: 'wrap' }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ mr: { sm: 0.5 } }}>
          Export production package
        </Typography>
        <Button variant="contained" onClick={handlePrint}>
          Print / Save PDF
        </Button>
        <Button variant="outlined" onClick={() => downloadTextReport(pkg)}>
          Download text
        </Button>
        <Button variant="outlined" onClick={() => downloadJsonPackage(pkg)}>
          Download JSON
        </Button>
      </Stack>

      {reportError && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {reportError}
        </Alert>
      )}

      <Alert severity="info" sx={{ mt: 2 }}>
        For a clean PDF in Chrome or Edge, open <strong>More settings</strong> in
        the print dialog and turn off <strong>Headers and footers</strong>.
        Browsers do not allow a web app to change that print setting for you.
      </Alert>

      <Alert severity={pkg.audit.passed ? 'success' : 'error'} sx={{ mt: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          Governance &amp; provenance audit{' '}
          {pkg.audit.passed ? 'passed' : 'did not pass'} with{' '}
          {pkg.audit.issues.length} issue
          {pkg.audit.issues.length === 1 ? '' : 's'}.
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {AUDIT_SCOPE_NOTE}
        </Typography>
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
            record={pkg.filmBrief}
            kind="filmBrief"
            showId={false}
          />
        </AccordionDetails>
      </Accordion>

      {sections.map(([label, kind, records]) => (
        <Accordion key={label}>
          <AccordionSummary>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
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
          <Typography sx={{ fontWeight: 700 }}>
            Governance &amp; Provenance Audit
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {AUDIT_SCOPE_NOTE}
          </Typography>
          {pkg.audit.issues.length === 0 ? (
            <Alert severity="success">
              No governance/provenance integrity issues were reported.
            </Alert>
          ) : (
            <Stack spacing={1}>
              {pkg.audit.issues.map((issue) => (
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
