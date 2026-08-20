import {
  Alert,
  Box,
  Button,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
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
          Shape the film before Tital starts researching
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 900 }}>
          Set the creative and audience constraints up front. Tital will use Gemini to build the remaining FilmBrief around these choices, persist them with the session, and stop at the FilmBrief human-review gate.
        </Typography>
      </Stack>

      <Alert severity="warning" sx={{ mt: 2.5 }}>
        Creating a project is a live runtime action and can consume Gemini / Vertex AI quota or credits.
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
              helperText="Editable: describe the voice and viewing experience you want."
              slotProps={{ htmlInput: { maxLength: 400 } }}
            />
          </Box>
        </Box>

        <Alert severity="info" variant="outlined">
          These controls are not suggestions to the model. Tital enforces the values you provide when it assembles the FilmBrief, while Gemini proposes the scientific framing, learning goals, scope, constraints, and research requirements.
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
