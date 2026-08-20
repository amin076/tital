import { Alert, Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
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
    <Box sx={{ position: 'fixed', right: 16, bottom: 16, zIndex: 1400, width: { xs: 'calc(100% - 32px)', sm: 420 } }}>
      <Paper elevation={8} sx={{ p: 2 }}>
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="overline" color="text.secondary">Demo publishing</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Publish a completed project</Typography>
            </Box>
            <Chip size="small" label="Authenticated only" variant="outlined" />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            This creates a detached read-only snapshot in the public demo store. Personal project input, account identity, and session event history are not copied.
          </Typography>
          {completed.map((session) => (
            <Stack key={session.sessionId} direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' } }}>
              <Typography variant="body2" sx={{ flex: 1 }}>{session.title}</Typography>
              <Button size="small" variant="contained" disabled={Boolean(busyId)} onClick={() => void publish(session)}>
                {busyId === session.sessionId ? 'Publishing…' : 'Publish as demo'}
              </Button>
            </Stack>
          ))}
          {message && <Alert severity="success">{message} Refresh the public landing page to enable “Explore completed demo”.</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </Paper>
    </Box>
  );
}
