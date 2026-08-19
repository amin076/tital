import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type Auth,
  type User,
} from 'firebase/auth';

export interface PublicRuntimeConfig {
  authRequired: boolean;
  firebase: {
    projectId: string;
    apiKey: string;
    authDomain: string;
  } | null;
  demoAvailable: boolean;
}

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let runtimeConfig: PublicRuntimeConfig | null = null;

export async function loadPublicRuntimeConfig(): Promise<PublicRuntimeConfig> {
  if (runtimeConfig) return runtimeConfig;
  const response = await fetch('/api/public/config', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Unable to load Tital runtime configuration (${response.status}).`);
  }
  runtimeConfig = (await response.json()) as PublicRuntimeConfig;
  return runtimeConfig;
}

export async function initializeTitalAuth(): Promise<{
  config: PublicRuntimeConfig;
  auth: Auth | null;
}> {
  const config = await loadPublicRuntimeConfig();
  if (!config.authRequired) return { config, auth: null };
  if (!config.firebase) {
    throw new Error('Tital authentication is enabled without Firebase web configuration.');
  }

  if (!firebaseApp) {
    firebaseApp = initializeApp(config.firebase);
    auth = getAuth(firebaseApp);
  }

  return { config, auth };
}

export function observeAuthState(
  activeAuth: Auth,
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(activeAuth, callback);
}

export async function signIn(email: string, password: string): Promise<User> {
  const initialized = await initializeTitalAuth();
  if (!initialized.auth) {
    throw new Error('Authentication is not enabled for this Tital deployment.');
  }
  const credential = await signInWithEmailAndPassword(
    initialized.auth,
    email,
    password
  );
  return credential.user;
}

export async function signOut(): Promise<void> {
  const initialized = await initializeTitalAuth();
  if (initialized.auth) await firebaseSignOut(initialized.auth);
}

export async function getIdToken(): Promise<string | null> {
  const initialized = await initializeTitalAuth();
  if (!initialized.auth) return null;
  const user = initialized.auth.currentUser;
  return user ? user.getIdToken() : null;
}
