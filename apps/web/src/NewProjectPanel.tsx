import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { createSession, type SessionView } from './api';

const knowledgeLevels = [
  'No specialist scientific background',
  'Introductory',
  'Intermediate',
  'Advanced / specialist',
];

const filmFormats = [
  'Popular-science short',
  'Documentary short',
  'Educational explainer',
  'Investigative science film',
];

const collaborationModes = [
  ['AI_ASSISTED', 'AI-assisted — Tital proposes most cinematic choices'],
  ['COLLABORATIVE', 'Collaborative — AI proposes inside my direction'],
  ['DIRECTOR_LED', 'Director-led — treat my direction as the creative default'],
] as const;

const pacingOptions = [
  ['CONTEMPLATIVE', 'Contemplative'],
  ['BALANCED', 'Balanced'],
  ['ENERGETIC', 'Energetic'],
] as const;

const cameraOptions = [
  ['RESTRAINED', 'Restrained movement'],
  ['BALANCED', 'Balanced movement'],
  ['EXPRESSIVE', 'Expressive / dynamic movement'],
] as const;

const representationOptions = [
  ['REAL_IMAGERY_FIRST', 'Real imagery / physical demonstration first'],
  ['BALANCED', 'Balance real imagery and explanatory visuals'],
  ['EXPLANATORY_VISUALS_FIRST', 'Explanatory animation / diagrams when useful'],
] as const;

function parseAvoidItems(value: string): string[] {
  return value
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export function NewProjectPanel({
  busy,
  onCreated,
  onBusyChange,
  onError,
}: {
  busy: boolean;
  onCreated: (view: SessionView) => Promise<void> | void;
  onBusyChange: (busy: boolean) => void;
  onError: (message: string | null) => void;
}) {
  const [rawIdea, setRawIdea] = useState('');
  const [title, setTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('5');
  const [targetAudience, setTargetAudience] = useState('General public');
  const [audienceKnowledgeLevel, setAudienceKnowledgeLevel] = useState(
    'No specialist scientific background'
  );
  const [format, setFormat] = useState('Popular-science short');
  const [tone, setTone] = useState(
    'Engaging, cinematic, accessible, scientifically rigorous'
  );
  const [collaborationMode, setCollaborationMode] = useState<
    'AI_ASSISTED' | 'COLLABORATIVE' | 'DIRECTOR_LED'
  >('COLLABORATIVE');
  const [pacing, setPacing] = useState<
    'CONTEMPLATIVE' | 'BALANCED' | 'ENERGETIC'
  >('BALANCED');
  const [cameraMovement, setCameraMovement] = useState<
    'RESTRAINED' | 'BALANCED' | 'EXPRESSIVE'
  >('BALANCED');
  const [representationPreference, setRepresentationPreference] = useState<
    'REAL_IMAGERY_FIRST' | 'BALANCED' | 'EXPLANATORY_VISUALS_FIRST'
  >('BALANCED');
  const [visualStyle, setVisualStyle] = useState('');
  const [directorNotes, setDirectorNotes] = useState('');
  const [avoid, setAvoid] = useState('');

  const avoidItems = useMemo(() => parseAvoidItems(avoid), [avoid]);
  const trimmedIdea = rawIdea.trim();
  const parsedDuration = Number(durationMinutes);
  const durationValid =
    Number.isFinite(parsedDuration) && parsedDuration >= 0.5 && parsedDuration <= 180;
  const requiredControlsValid =
    targetAudience.trim().length > 0 &&
    audienceKnowledgeLevel.trim().length > 0 &&
    format.trim().length > 0 &&
    tone.trim().length > 0;
  const canSubmit = Boolean(trimmedIdea && durationValid && requiredControlsValid && !busy);

  async function submit(): Promise<void> {
    if (!canSubmit) return;

    onBusyChange(true);
    onError(null);
    try {
      const view = await createSession({
        rawIdea: trimmedIdea,
        ...(title.trim() ? { title: title.trim() } : {}),
        durationMinutes: parsedDuration,
        targetAudience: targetAudience.trim(),
        audienceKnowledgeLevel: audienceKnowledgeLevel.trim(),
        format: format.trim(),
        tone: tone.trim(),
        directorBrief: {
          collaborationMode,
          pacing,
          cameraMovement,
          representationPreference,
          ...(visualStyle.trim() ? { visualStyle: visualStyle.trim() } : {}),
          ...(directorNotes.trim() ? { notes: directorNotes.trim() } : {}),
          avoid: avoidItems,
        },
      });
      setRawIdea('');
      setTitle('');
      await onCreated(view);
    } catch (cause: unknown) {
      onError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      onBusyChange(false);
    }
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 3,
        background:
          'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,251,253,1) 100%)',
      }}
    >
      <Stack spacing={0.75}>
        <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700 }}>
          New project
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Shape the science and the visual direction before Tital starts researching
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 900 }}>
          Set audience and production constraints, then give Tital a compact Director Brief. The AI still proposes scenes, shots, and visual decisions, but it must work inside approved scientific constraints and your creative direction.
        </Typography>
      </Stack>

      <Alert severity="warning" sx={{ mt: 2.5 }}>
        Creating a project is a live runtime action and can consume Gemini / Vertex AI quota or credits. FilmBrief generation time is measured as part of the project performance profile.
      </Alert>

      <Stack spacing={2.25} sx={{ mt: 2.5 }}>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
            Film concept
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 220px' },
              gap: 1.5,
            }}
          >
            <TextField
              label="Project title"
              placeholder="What Really Killed the Dinosaurs?"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={busy}
              helperText="Optional. If supplied, Tital treats this as the authoritative film title."
              slotProps={{ htmlInput: { maxLength: 160 } }}
            />
            <TextField
              label="Duration"
              type="number"
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
              disabled={busy}
              error={durationMinutes.length > 0 && !durationValid}
              helperText="Minutes (0.5–180)"
              slotProps={{ htmlInput: { min: 0.5, max: 180, step: 0.5 } }}
            />
          </Box>

          <TextField
            label="Scientific film idea"
            placeholder="Investigate the evidence for the Chicxulub impact, the possible role of Deccan Traps volcanism, and what scientists can and cannot conclude about the dinosaur extinction."
            value={rawIdea}
            onChange={(event) => setRawIdea(event.target.value)}
            multiline
            minRows={4}
            fullWidth
            disabled={busy}
            helperText={`${rawIdea.length.toLocaleString()} / 5,000 characters`}
            slotProps={{ htmlInput: { maxLength: 5000 } }}
            sx={{ mt: 1.5 }}
          />
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
            Audience & production controls
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
              gap: 1.5,
            }}
          >
            <TextField
              label="Target audience"
              value={targetAudience}
              onChange={(event) => setTargetAudience(event.target.value)}
              disabled={busy}
              placeholder="General public"
              helperText="Who should understand and enjoy this film?"
              slotProps={{ htmlInput: { maxLength: 240 } }}
            />

            <TextField
              select
              label="Audience knowledge level"
              value={audienceKnowledgeLevel}
              onChange={(event) => setAudienceKnowledgeLevel(event.target.value)}
              disabled={busy}
              helperText="Sets the assumed scientific background."
            >
              {knowledgeLevels.map((level) => (
                <MenuItem key={level} value={level}>
                  {level}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Film format"
              value={format}
              onChange={(event) => setFormat(event.target.value)}
              disabled={busy}
              helperText="Guides the structure of the FilmBrief and later production package."
            >
              {filmFormats.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Tone"
              value={tone}
              onChange={(event) => setTone(event.target.value)}
              disabled={busy}
              helperText="Describe the voice and viewing experience you want."
              slotProps={{ htmlInput: { maxLength: 400 } }}
            />
          </Box>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 700 }}>
            Director Brief
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, maxWidth: 900 }}>
            These controls guide cinematic proposals; they never override evidence, uncertainty, or scientific visual-integrity rules. Keep them broad and use natural-language notes for the choices that matter to you.
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
              gap: 1.5,
            }}
          >
            <TextField
              select
              label="Collaboration mode"
              value={collaborationMode}
              onChange={(event) => setCollaborationMode(event.target.value as typeof collaborationMode)}
              disabled={busy}
            >
              {collaborationModes.map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Pacing"
              value={pacing}
              onChange={(event) => setPacing(event.target.value as typeof pacing)}
              disabled={busy}
            >
              {pacingOptions.map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Camera behaviour"
              value={cameraMovement}
              onChange={(event) => setCameraMovement(event.target.value as typeof cameraMovement)}
              disabled={busy}
            >
              {cameraOptions.map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Representation preference"
              value={representationPreference}
              onChange={(event) => setRepresentationPreference(event.target.value as typeof representationPreference)}
              disabled={busy}
            >
              {representationOptions.map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </TextField>
          </Box>

          <TextField
            label="Visual language / style"
            placeholder="Example: restrained observational documentary; natural light; macro details; minimal spectacle; neutral colour treatment."
            value={visualStyle}
            onChange={(event) => setVisualStyle(event.target.value)}
            multiline
            minRows={2}
            fullWidth
            disabled={busy}
            slotProps={{ htmlInput: { maxLength: 1200 } }}
            sx={{ mt: 1.5 }}
          />
          <TextField
            label="Director notes"
            placeholder="Example: The first 30 seconds should feel mysterious. Prefer physical demonstrations over abstract CGI when both explain the science equally well."
            value={directorNotes}
            onChange={(event) => setDirectorNotes(event.target.value)}
            multiline
            minRows={2}
            fullWidth
            disabled={busy}
            slotProps={{ htmlInput: { maxLength: 2000 } }}
            sx={{ mt: 1.5 }}
          />
          <TextField
            label="Avoid"
            placeholder={'orbiting camera, sensational disaster imagery\nexcessive dramatic lighting'}
            value={avoid}
            onChange={(event) => setAvoid(event.target.value)}
            fullWidth
            multiline
            minRows={2}
            disabled={busy}
            helperText="Separate creative constraints with commas, semicolons, or new lines (maximum 20). Phrases stay intact; spaces alone do not split a constraint."
            sx={{ mt: 1.5 }}
          />
          {avoidItems.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">Parsed constraints</Typography>
              <Stack direction="row" spacing={0.6} useFlexGap sx={{ mt: 0.55, flexWrap: 'wrap' }}>
                {avoidItems.map((item) => (
                  <Chip
                    key={item}
                    size="small"
                    label={item}
                    variant="outlined"
                    sx={{
                      maxWidth: '100%',
                      height: 'auto',
                      '& .MuiChip-label': {
                        whiteSpace: 'normal',
                        py: 0.35,
                      },
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Box>

        <Alert severity="info" variant="outlined">
          Scientific truth and approved constraints have priority over style. The Director Brief is persisted with the project and passed into Scene, Shot, and Visual Decision generation. If you reject the last candidate for a branch, you can also give a scoped instruction when requesting a replacement.
        </Alert>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}
        >
          <Button
            variant="contained"
            size="large"
            disabled={!canSubmit}
            onClick={submit}
            sx={{ px: 3 }}
          >
            {busy ? 'Creating project…' : 'Create governed project'}
          </Button>
          <Typography variant="caption" color="text.secondary">
            Nothing is auto-approved. You will review the generated FilmBrief before research begins.
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}
