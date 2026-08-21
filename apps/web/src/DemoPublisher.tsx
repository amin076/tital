import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import type { User } from 'firebase/auth';
import { useEffect, useMemo, useState } from 'react';
import { getIdToken, initializeTitalAuth, observeAuthState } from './auth';
import { listSessions, type SessionSummary } from './api';

export function DemoPublisher() {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    initializeTitalAuth()
      .then(({ auth }) => {
        if (!auth) return;
        unsubscribe = observeAuthState(auth, (nextUser) => setUser(nextUser));
      })
      .catch(() => undefined);
    return () => unsubscribe?.();
  }, []);

  useEffect(() => {
    if (!user) {
      setSessions([]);
      setOpen(false);
      return;
    }
    listSessions().then(setSessions).catch(() => undefined);
  }, [user]);

  const completed = useMemo(
    () => sessions.filter((session) => session.productionPackageStatus === 'READY_FOR_PRODUCTION'),
    [sessions]
  );

  async function publish(session: SessionSummary): Promise<void> {
    setBusyId(session.sessionId);
    setMessage(null);
    setError(null);
    try {
      const token = await getIdToken();
      if (!token) throw new Error('Authentication is required.');
      const response = await fetch(
        `/api/sessions/${encodeURIComponent(session.sessionId)}/publish-demo`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error || `Publish failed (${response.status}).`);
      setMessage(`Published “${session.title}” as the detached public demo snapshot.`);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusyId(null);
    }
  }

  if (!user || completed.length === 0) return null;

  return (
    <>
      <Paper
        className="tital-glass"
        elevation={3}
        sx={{
          position: 'fixed',
          right: 18,
          bottom: 18,
          zIndex: 1250,
          p: 0.6,
          borderRadius: 999,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Button size="small" onClick={() => setOpen(true)} sx={{ borderRadius: 999, px: 1.7 }}>
          Demo tools
        </Button>
      </Paper>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => {
          if (!busyId) setOpen(false);
        }}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 440 },
              p: { xs: 2.25, sm: 3 },
              bgcolor: '#F8FAFB',
            },
          },
        }}
      >
        <Stack spacing={2.25} sx={{ height: '100%' }}>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="overline" color="text.secondary">Admin utility</Typography>
              <Typography variant="h5">Public demo publishing</Typography>
            </Box>
            <Button size="small" variant="text" disabled={Boolean(busyId)} onClick={() => setOpen(false)}>
              Close
            </Button>
          </Stack>

          <Alert severity="info">
            Publishing creates a detached read-only snapshot. Account identity, private project input, Director notes, and private event history are not copied.
          </Alert>

          <Divider />

          <Stack spacing={1.25}>
            <Typography variant="subtitle2" color="text.secondary">
              Completed projects
            </Typography>
            {completed.map((session) => (
              <Paper key={session.sessionId} variant="outlined" sx={{ p: 1.75, bgcolor: '#FFFFFF' }}>
                <Stack spacing={1.25}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 760 }}>{session.title}</Typography>
                    <Stack direction="row" spacing={0.75} sx={{ mt: 0.75 }}>
                      <Chip size="small" label="COMPLETE" color="success" variant="outlined" />
                      <Chip size="small" label="READY" variant="outlined" />
                    </Stack>
                  </Box>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={Boolean(busyId)}
                    onClick={() => void publish(session)}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    {busyId === session.sessionId ? 'Publishing…' : 'Publish as public demo'}
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Stack>

          {message && <Alert severity="success">{message} Refresh the public landing page to see the updated demo.</Alert>}
          {error && <Alert severity="error">{error}</Alert>}

          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" color="text.secondary">
            Authenticated administration only. The public demo remains read-only.
          </Typography>
        </Stack>
      </Drawer>
    </>
  );
}
