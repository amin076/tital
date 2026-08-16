import { Alert, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { createSession, type SessionView } from './api';

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
  const trimmed = rawIdea.trim();

  async function submit(): Promise<void> {
    if (!trimmed || busy) return;

    onBusyChange(true);
    onError(null);
    try {
      const view = await createSession(trimmed);
      setRawIdea('');
      await onCreated(view);
    } catch (cause: unknown) {
      onError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      onBusyChange(false);
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Typography variant="overline" color="text.secondary">
        New project
      </Typography>
      <Typography variant="h6">Start from a scientific film idea</Typography>
      <Typography color="text.secondary" sx={{ mt: 0.75 }}>
        Tital will use Gemini to create the initial FilmBrief, persist the new session, and stop at the FilmBrief human-review gate.
      </Typography>

      <Alert severity="warning" sx={{ mt: 2 }}>
        Creating a project is a live runtime action and can consume Gemini / Vertex AI quota or credits.
      </Alert>

      <Stack spacing={1.5} sx={{ mt: 2 }}>
        <TextField
          label="Scientific film idea"
          placeholder="A five-minute film explaining why the sky is blue for high-school students"
          value={rawIdea}
          onChange={(event) => setRawIdea(event.target.value)}
          multiline
          minRows={3}
          disabled={busy}
          slotProps={{ htmlInput: { maxLength: 5000 } }}
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}>
          <Button variant="contained" disabled={!trimmed || busy} onClick={submit}>
            {busy ? 'Creating…' : 'Create project'}
          </Button>
          <Typography variant="caption" color="text.secondary">
            The FilmBrief is not auto-approved. You will review it next.
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}
