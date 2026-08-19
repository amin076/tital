import {
  Alert,
  AppBar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import type { User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { App } from './App';
import { getPublicDemo, type SessionView } from './api';
import {
  initializeTitalAuth,
  observeAuthState,
  signIn,
  signOut,
  type PublicRuntimeConfig,
} from './auth';
import { FinalResultsPanel } from './FinalResultsPanel';
import { WorkflowInsightsPanel } from './WorkflowInsightsPanel';

type PublicMode = 'HOME' | 'LOGIN' | 'DEMO';

function PublicHeader({ onHome }: { onHome: () => void }) {
  return (
    <AppBar position="static" elevation={0}>
      <Toolbar>
        <Box sx={{ flex: 1, cursor: 'pointer' }} onClick={onHome}>
          <Typography variant="h6">Tital</Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Evidence-Governed Scientific Film Director
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

function PublicHome({
  config,
  onDemo,
  onLogin,
}: {
  config: PublicRuntimeConfig;
  onDemo: () => void;
  onLogin: () => void;
}) {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
      <Stack spacing={4}>
        <Box sx={{ maxWidth: 820 }}>
          <Chip label="Agentic scientific filmmaking" color="primary" variant="outlined" />
          <Typography variant="h2" sx={{ mt: 2, fontWeight: 800, letterSpacing: -1.5 }}>
            Scientific film direction with evidence attached to every decision.
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mt: 2, lineHeight: 1.6 }}>
            Tital turns a scientific idea into an evidence-governed production package through research, claims, script lines, scenes, shots, visual decisions, human review gates, and provenance auditing.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
            <Button variant="contained" size="large" onClick={onDemo} disabled={!config.demoAvailable}>
              Explore completed demo
            </Button>
            <Button variant="outlined" size="large" onClick={onLogin}>
              Sign in to live Tital
            </Button>
          </Stack>
          {!config.demoAvailable && (
            <Alert severity="info" sx={{ mt: 2 }}>
              The public demo is being prepared. Authorized users can still sign in to the live workflow.
            </Alert>
          )}
        </Box>

        <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 } }}>
          <Typography variant="overline" color="text.secondary">Evidence → Story</Typography>
          <Typography variant="h5" sx={{ mt: 0.5 }}>A governed production chain, not a one-shot generator</Typography>
          <Typography color="text.secondary" sx={{ mt: 1.5 }}>
            Scientific idea → FilmBrief → Research Questions → Sources → Evidence → Claims → Script Lines → Scenes → Shots → Visual Decisions → Governance & provenance audit → Production Package
          </Typography>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            <Box>
              <Typography variant="h6">Evidence-first</Typography>
              <Typography color="text.secondary">Claims and creative decisions remain connected to approved upstream scientific material.</Typography>
            </Box>
            <Box>
              <Typography variant="h6">Human-gated</Typography>
              <Typography color="text.secondary">The model proposes; the application validates and humans approve or reject before progression.</Typography>
            </Box>
            <Box>
              <Typography variant="h6">Traceable</Typography>
              <Typography color="text.secondary">Reviewers can ask why a line or visual exists and trace it back through the governed chain.</Typography>
            </Box>
          </Box>
        </Paper>
      </Stack>
    </Container>
  );
}

function LoginPanel({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(): Promise<void> {
    if (!email.trim() || !password || busy) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 7 }}>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Typography variant="overline" color="text.secondary">Authorized live access</Typography>
        <Typography variant="h4">Sign in to Tital</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Live projects can invoke Gemini / Vertex AI and research tooling. Hackathon judges receive evaluation credentials privately.
        </Typography>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        <Stack spacing={2} sx={{ mt: 3 }}>
          <TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
          <TextField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" onKeyDown={(event) => { if (event.key === 'Enter') void submit(); }} />
          <Button variant="contained" size="large" disabled={busy || !email.trim() || !password} onClick={() => void submit()}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
          <Button variant="text" onClick={onBack}>Back to public demo</Button>
        </Stack>
      </Paper>
    </Container>
  );
}

function DemoPanel({ onBack, onLogin }: { onBack: () => void; onLogin: () => void }) {
  const [view, setView] = useState<SessionView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPublicDemo().then(setView).catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : String(cause));
    });
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Stack spacing={2.5}>
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}>
            <Box>
              <Chip label="Completed public demo" color="success" variant="outlined" />
              <Typography variant="h4" sx={{ mt: 1 }}>See the result before waiting for a live run</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                A full Tital production can require many agent calls and human review gates. This read-only completed project lets evaluators inspect the governed output immediately.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={onBack}>Home</Button>
              <Button variant="contained" onClick={onLogin}>Sign in for live run</Button>
            </Stack>
          </Stack>
        </Paper>

        {error ? <Alert severity="error">{error}</Alert> : !view ? (
          <Paper variant="outlined" sx={{ minHeight: 220, display: 'grid', placeItems: 'center' }}><CircularProgress /></Paper>
        ) : (
          <>
            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Typography variant="overline" color="text.secondary">Demo project</Typography>
              <Typography variant="h4">{view.summary.title}</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>{view.rawIdea}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Chip label={view.summary.stage} color={view.summary.stage === 'COMPLETE' ? 'success' : 'primary'} />
                {view.summary.productionPackageStatus && <Chip label={view.summary.productionPackageStatus} variant="outlined" />}
              </Stack>
            </Paper>
            <WorkflowInsightsPanel insights={view.workflowInsights} />
            <FinalResultsPanel productionPackage={view.productionPackage} />
          </>
        )}
      </Stack>
    </Container>
  );
}

export function RootApp() {
  const [config, setConfig] = useState<PublicRuntimeConfig | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<PublicMode>('HOME');

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    initializeTitalAuth()
      .then(({ config: nextConfig, auth }) => {
        setConfig(nextConfig);
        if (!nextConfig.authRequired || !auth) {
          setInitializing(false);
          return;
        }
        unsubscribe = observeAuthState(auth, (nextUser) => {
          setUser(nextUser);
          setInitializing(false);
        });
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : String(cause));
        setInitializing(false);
      });
    return () => unsubscribe?.();
  }, []);

  if (initializing) {
    return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>;
  }

  if (error || !config) {
    return <Container maxWidth="sm" sx={{ py: 8 }}><Alert severity="error">{error || 'Tital runtime configuration could not be loaded.'}</Alert></Container>;
  }

  if (!config.authRequired) return <App />;

  if (user) {
    return (
      <Box>
        <Paper square variant="outlined" sx={{ px: 2, py: 0.75, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">Signed in as {user.email || user.uid}</Typography>
          <Button size="small" onClick={() => void signOut()}>Sign out</Button>
        </Paper>
        <App />
      </Box>
    );
  }

  return (
    <>
      <PublicHeader onHome={() => setMode('HOME')} />
      {mode === 'HOME' && <PublicHome config={config} onDemo={() => setMode('DEMO')} onLogin={() => setMode('LOGIN')} />}
      {mode === 'LOGIN' && <LoginPanel onBack={() => setMode('HOME')} />}
      {mode === 'DEMO' && <DemoPanel onBack={() => setMode('HOME')} onLogin={() => setMode('LOGIN')} />}
    </>
  );
}
