import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import type { ApprovedChain, GateRecord } from './api';

function stringValue(record: GateRecord, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

function stringArray(record: GateRecord, key: string): string[] {
  const value = record[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function title(record: GateRecord): string {
  return (
    stringValue(record, 'title') ??
    stringValue(record, 'question') ??
    stringValue(record, 'text') ??
    stringValue(record, 'description') ??
    stringValue(record, 'decision') ??
    record.id
  );
}

function MiniRecords({ label, records }: { label: string; records: GateRecord[] }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label} · {records.length}
      </Typography>
      <Stack spacing={0.5} sx={{ mt: 0.5 }}>
        {records.slice(0, 8).map((record) => (
          <Typography key={record.id} variant="body2">
            <Box component="span" sx={{ fontWeight: 700 }}>
              {title(record)}
            </Box>{' '}
            <Box component="span" sx={{ color: 'text.secondary' }}>
              · {record.id}
            </Box>
          </Typography>
        ))}
        {records.length > 8 && (
          <Typography variant="caption" color="text.secondary">
            +{records.length - 8} more
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

export function ProvenancePanel({ chain }: { chain: ApprovedChain }) {
  if (chain.researchQuestions.length === 0) return null;

  const claimsById = new Map(chain.claims.map((record) => [record.id, record]));
  const evidenceById = new Map(chain.evidence.map((record) => [record.id, record]));
  const sourcesById = new Map(chain.sources.map((record) => [record.id, record]));

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Typography variant="overline" color="text.secondary">
        Traceability
      </Typography>
      <Typography variant="h5">Why are we saying or showing this?</Typography>
      <Typography color="text.secondary" sx={{ mt: 0.75 }}>
        Follow the approved chain from source and evidence through claims and script to scenes,
        shots, and governed visual decisions.
      </Typography>

      <Alert severity="info" sx={{ mt: 2 }}>
        Only approved, provenance-connected records are shown here. Rejected historical records remain
        persisted in the session but do not enter this production chain.
      </Alert>

      <Stack spacing={1} sx={{ mt: 2 }}>
        {chain.researchQuestions.map((question) => {
          const questionId = question.id;
          const questionSources = chain.sources.filter(
            (record) => stringValue(record, 'researchQuestionId') === questionId
          );
          const questionEvidence = chain.evidence.filter(
            (record) => stringValue(record, 'researchQuestionId') === questionId
          );
          const questionClaims = chain.claims.filter(
            (record) => stringValue(record, 'researchQuestionId') === questionId
          );
          const questionScripts = chain.scriptLines.filter(
            (record) => stringValue(record, 'researchQuestionId') === questionId
          );
          const questionScenes = chain.scenes.filter(
            (record) => stringValue(record, 'researchQuestionId') === questionId
          );
          const questionShots = chain.shots.filter(
            (record) => stringValue(record, 'researchQuestionId') === questionId
          );
          const shotIds = new Set(questionShots.map((record) => record.id));
          const questionVisuals = chain.visualDecisions.filter((record) => {
            const shotId = stringValue(record, 'shotId');
            return shotId ? shotIds.has(shotId) : false;
          });

          return (
            <Accordion key={questionId}>
              <AccordionSummary>
                <Box sx={{ width: '100%', pr: 2 }}>
                  <Typography sx={{ fontWeight: 700 }}>{title(question)}</Typography>
                  <Stack direction="row" spacing={0.5} useFlexGap sx={{ mt: 1, flexWrap: 'wrap' }}>
                    <Chip size="small" label={`${questionSources.length} sources`} variant="outlined" />
                    <Chip size="small" label={`${questionEvidence.length} evidence`} variant="outlined" />
                    <Chip size="small" label={`${questionClaims.length} claims`} variant="outlined" />
                    <Chip size="small" label={`${questionScripts.length} script lines`} variant="outlined" />
                    <Chip size="small" label={`${questionScenes.length} scenes`} variant="outlined" />
                    <Chip size="small" label={`${questionShots.length} shots`} variant="outlined" />
                    <Chip size="small" label={`${questionVisuals.length} visuals`} variant="outlined" />
                  </Stack>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1.5}>
                  {questionScripts.map((script) => {
                    const claimIds = stringArray(script, 'claimIds');
                    const claims = claimIds
                      .map((id) => claimsById.get(id))
                      .filter((record): record is GateRecord => Boolean(record));
                    const evidenceIds = new Set(claims.flatMap((record) => stringArray(record, 'evidenceIds')));
                    const evidence = Array.from(evidenceIds)
                      .map((id) => evidenceById.get(id))
                      .filter((record): record is GateRecord => Boolean(record));
                    const sourceIds = new Set(
                      evidence
                        .map((record) => stringValue(record, 'sourceId'))
                        .filter((id): id is string => Boolean(id))
                    );
                    const sources = Array.from(sourceIds)
                      .map((id) => sourcesById.get(id))
                      .filter((record): record is GateRecord => Boolean(record));
                    const scenes = questionScenes.filter((record) =>
                      stringArray(record, 'scriptLineIds').includes(script.id)
                    );
                    const sceneIds = new Set(scenes.map((record) => record.id));
                    const shots = questionShots.filter((record) => {
                      const sceneId = stringValue(record, 'sceneId');
                      return (
                        (sceneId ? sceneIds.has(sceneId) : false) ||
                        stringArray(record, 'scriptLineIds').includes(script.id)
                      );
                    });
                    const linkedShotIds = new Set(shots.map((record) => record.id));
                    const visuals = questionVisuals.filter((record) => {
                      const shotId = stringValue(record, 'shotId');
                      return shotId ? linkedShotIds.has(shotId) : false;
                    });

                    return (
                      <Card key={script.id} variant="outlined">
                        <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                          <Typography variant="overline" color="text.secondary">
                            Script line trace
                          </Typography>
                          <Typography sx={{ fontWeight: 700 }}>{title(script)}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {script.id}
                          </Typography>

                          <Box
                            sx={{
                              mt: 1.5,
                              p: 1.25,
                              borderRadius: 1,
                              bgcolor: 'grey.100',
                              fontFamily: 'monospace',
                              fontSize: 12,
                              overflowX: 'auto',
                            }}
                          >
                            Source → Evidence → Claim → Script → Scene → Shot → Visual Decision
                          </Box>

                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                              gap: 1.5,
                              mt: 1.5,
                            }}
                          >
                            <MiniRecords label="Sources" records={sources} />
                            <MiniRecords label="Evidence" records={evidence} />
                            <MiniRecords label="Claims" records={claims} />
                            <MiniRecords label="Scenes" records={scenes} />
                            <MiniRecords label="Shots" records={shots} />
                            <MiniRecords label="Visual decisions" records={visuals} />
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>
    </Paper>
  );
}
