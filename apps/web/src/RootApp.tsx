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
import { getPublicDemo, type ProductionPackage, type SessionView } from './api';
import {
  initializeTitalAuth,
  observeAuthState,
  signIn,
  signOut,
  type PublicRuntimeConfig,
} from './auth';
import { EvidenceStoryTrace } from './EvidenceStoryTrace';
import { FinalResultsPanel } from './FinalResultsPanel';
import { WorkflowInsightsPanel } from './WorkflowInsightsPanel';

type PublicMode = 'HOME' | 'LOGIN' | 'DEMO';

const PIPELINE = [
  ['01', 'Research'],
  ['02', 'Evidence'],
  ['03', 'Claims'],
  ['04', 'Script'],
  ['05', 'Scenes'],
  ['06', 'Shots'],
  ['07', 'Visuals'],
] as const;

function PublicHeader({ onHome }: { onHome: () => void }) {
  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ flex: 1, alignItems: 'center', cursor: 'pointer' }}
          onClick={onHome}
        >
          <Box
            aria-hidden
            sx={{
              width: 34,
              height: 34,
              borderRadius: 2.3,
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.14)',
              fontWeight: 900,
              letterSpacing: '-0.05em',
            }}
          >
            T
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 850, lineHeight: 1.05 }}>
              Tital
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.72 }}>
              Evidence-Governed Scientific Film Director
            </Typography>
          </Box>
        </Stack>
        <Chip
          size="small"
          label="Human-gated agentic workflow"
          variant="outlined"
          sx={{
            display: { xs: 'none', sm: 'inline-flex' },
            color: 'rgba(255,255,255,0.9)',
            borderColor: 'rgba(255,255,255,0.22)',
          }}
        />
      </Toolbar>
    </AppBar>
  );
}

function PipelinePreview() {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2.25, md: 2.75 },
        bgcolor: 'rgba(255,255,255,0.92)',
        boxShadow: '0 22px 70px rgba(16, 52, 77, 0.11)',
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="overline" color="secondary.main">Evidence → Story</Typography>
          <Typography variant="h6">A visible chain of responsibility</Typography>
        </Box>
        <Chip size="small" label="Governed" color="success" variant="outlined" />
      </Stack>

      <Stack spacing={0.8} sx={{ mt: 2.3 }}>
        {PIPELINE.map(([number, label], index) => (
          <Stack
            key={label}
            direction="row"
            spacing={1.25}
            sx={{ alignItems: 'center', py: 0.8, borderBottom: index === PIPELINE.length - 1 ? 0 : '1px solid', borderColor: 'divider' }}
          >
            <Typography variant="caption" sx={{ width: 26, color: 'text.secondary', fontWeight: 800 }}>
              {number}
            </Typography>
            <Typography variant="body2" sx={{ flex: 1, fontWeight: 720 }}>
              {label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {index < 2 ? 'scientific basis' : index < 4 ? 'story logic' : 'cinematic decision'}
            </Typography>
          </Stack>
        ))}
      </Stack>

      <Box sx={{ mt: 2.25, p: 1.6, borderRadius: 3, bgcolor: '#F1F7F7', border: '1px solid #D8EAE6' }}>
        <Typography variant="body2" sx={{ fontWeight: 760, color: 'secondary.dark' }}>
          AI proposes. Evidence constrains. Directors decide.
        </Typography>
      </Box>
    </Paper>
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
    <Box className="tital-grid-fade">
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 9 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.25fr) minmax(340px, .75fr)' },
            gap: { xs: 4, md: 6 },
            alignItems: 'center',
          }}
        >
          <Box>
            <Chip label="Agentic scientific filmmaking" color="secondary" variant="outlined" />
            <Typography variant="h1" sx={{ mt: 2.25, maxWidth: 900 }}>
              From scientific evidence to cinematic decisions.
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ mt: 2.5, lineHeight: 1.6, fontWeight: 520, maxWidth: 800 }}
            >
              Tital researches a scientific question, builds an evidence-backed story, and lets the director govern every claim, scene, shot, and visual decision before a production package is released.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.4} sx={{ mt: 3.4 }}>
              <Button variant="contained" size="large" onClick={onDemo} disabled={!config.demoAvailable}>
                Explore completed demo
              </Button>
              <Button variant="outlined" size="large" onClick={onLogin}>
                Open live workspace
              </Button>
            </Stack>
            {!config.demoAvailable && (
              <Alert severity="info" sx={{ mt: 2 }}>
                The public demo is being prepared. Authorized users can still enter the live workflow.
              </Alert>
            )}

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                gap: 1.25,
                mt: 4.5,
              }}
            >
              {[
                ['Evidence-first', 'Creative outputs stay connected to approved scientific material.'],
                ['Human authority', 'The agent pauses at review gates; people approve, reject, retry, or waive.'],
                ['Traceable output', 'A final visual can be followed back through script, claim, evidence, and source.'],
              ].map(([title, body]) => (
                <Box key={title} sx={{ pr: { sm: 2 } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{body}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <PipelinePreview />
        </Box>
      </Container>
    </Box>
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
    <Container maxWidth="sm" sx={{ py: { xs: 5, md: 8 } }}>
      <Paper variant="outlined" sx={{ p: { xs: 2.75, sm: 4 }, boxShadow: '0 18px 50px rgba(16, 52, 77, 0.08)' }}>
        <Chip size="small" label="Authorized live access" color="primary" variant="outlined" />
        <Typography variant="h4" sx={{ mt: 1.5 }}>Enter the Tital workspace</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Live projects can invoke Gemini / Vertex AI and research tooling. The completed public demo remains available without credentials.
        </Typography>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        <Stack spacing={2} sx={{ mt: 3 }}>
          <TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
          <TextField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" onKeyDown={(event) => { if (event.key === 'Enter') void submit(); }} />
          <Button variant="contained" size="large" disabled={busy || !email.trim() || !password} onClick={() => void submit()}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
          <Button variant="text" onClick={onBack}>Back to public experience</Button>
        </Stack>
      </Paper>
    </Container>
  );
}

function packageMetrics(pkg: ProductionPackage) {
  return [
    ['Research', pkg.researchQuestions.length],
    ['Sources', pkg.sources.length],
    ['Evidence', pkg.evidence.length],
    ['Claims', pkg.claims.length],
    ['Script', pkg.scriptLines.length],
    ['Scenes', pkg.scenes.length],
    ['Shots', pkg.shots.length],
    ['Visuals', pkg.visualDecisions.length],
  ] as const;
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
    <Container maxWidth="xl" sx={{ py: { xs: 2.5, md: 4 } }}>
      <Stack spacing={2.5}>
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2.5, md: 3.5 },
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F2F7F8 62%, #F8F4EC 100%)',
            boxShadow: '0 18px 60px rgba(16, 52, 77, 0.07)',
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}>
            <Box sx={{ maxWidth: 900 }}>
              <Chip label="Completed public demo" color="success" variant="outlined" />
              <Typography variant="h3" sx={{ mt: 1.5 }}>See how evidence becomes a film decision.</Typography>
              <Typography color="text.secondary" sx={{ mt: 1.15, maxWidth: 850 }}>
                This is a detached, read-only Tital project. Inspect the governed chain immediately, then sign in only if you want to run the live agentic workflow yourself.
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button variant="outlined" onClick={onBack}>Public home</Button>
              <Button variant="contained" onClick={onLogin}>Open live workspace</Button>
            </Stack>
          </Stack>
        </Paper>

        {error ? <Alert severity="error">{error}</Alert> : !view ? (
          <Paper variant="outlined" sx={{ minHeight: 260, display: 'grid', placeItems: 'center' }}><CircularProgress /></Paper>
        ) : (
          <>
            <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3.5 } }}>
              <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} sx={{ justifyContent: 'space-between', alignItems: { lg: 'flex-end' } }}>
                <Box sx={{ maxWidth: 880 }}>
                  <Typography variant="overline" color="text.secondary">Demo project</Typography>
                  <Typography variant="h3" sx={{ mt: 0.4 }}>{view.summary.title}</Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ mt: 1, fontWeight: 520 }}>{view.rawIdea}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }} useFlexGap>
                    <Chip label="COMPLETE" color="success" />
                    {view.summary.productionPackageStatus && <Chip label={view.summary.productionPackageStatus.replaceAll('_', ' ')} variant="outlined" />}
                    <Chip label="Read-only snapshot" color="secondary" variant="outlined" />
                  </Stack>
                </Box>
                <Box sx={{ maxWidth: 450 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>What to look for:</strong> human review gates, explicit coverage, a passing governance/provenance audit, and a source-to-visual trace that survives all the way into the production package.
                  </Typography>
                </Box>
              </Stack>

              {view.productionPackage && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))',
                      gap: 1,
                    }}
                  >
                    {packageMetrics(view.productionPackage).map(([label, value]) => (
                      <Box key={label} sx={{ p: 1.5, borderRadius: 3, bgcolor: '#F7F9FA', border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="h5" sx={{ fontWeight: 820 }}>{value}</Typography>
                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </Paper>

            {view.productionPackage && <EvidenceStoryTrace productionPackage={view.productionPackage} />}
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
        <Paper
          square
          variant="outlined"
          sx={{
            px: { xs: 1.5, md: 2.5 },
            py: 0.65,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 1,
            bgcolor: '#FBFCFD',
          }}
        >
          <Typography variant="caption" color="text.secondary">Signed in as {user.email || user.uid}</Typography>
          <Button size="small" variant="text" onClick={() => void signOut()}>Sign out</Button>
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
