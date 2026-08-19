import type { IncomingMessage } from 'node:http';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

export interface TitalAuthConfig {
  required: boolean;
  projectId: string;
  apiKey: string;
  authDomain: string;
}

export interface AuthenticatedUser {
  uid: string;
  email: string | null;
}

export function resolveTitalAuthConfig(
  env: NodeJS.ProcessEnv = process.env
): TitalAuthConfig {
  const required = env.TITAL_AUTH_REQUIRED?.trim().toLowerCase() === 'true';
  const projectId =
    env.TITAL_FIREBASE_PROJECT_ID?.trim() ||
    env.GOOGLE_CLOUD_PROJECT?.trim() ||
    '';
  const apiKey = env.TITAL_FIREBASE_API_KEY?.trim() || '';
  const authDomain = env.TITAL_FIREBASE_AUTH_DOMAIN?.trim() || '';

  if (required && (!projectId || !apiKey || !authDomain)) {
    throw new Error(
      'Tital authentication is enabled but Firebase web configuration is incomplete. Set TITAL_FIREBASE_PROJECT_ID, TITAL_FIREBASE_API_KEY, and TITAL_FIREBASE_AUTH_DOMAIN.'
    );
  }

  return { required, projectId, apiKey, authDomain };
}

function ensureAdminApp(projectId: string): void {
  if (getApps().length === 0) {
    initializeApp(projectId ? { projectId } : undefined);
  }
}

function bearerToken(request: IncomingMessage): string | null {
  const header = request.headers.authorization;
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export async function authenticateRequest(
  request: IncomingMessage,
  config: TitalAuthConfig
): Promise<AuthenticatedUser | null> {
  if (!config.required) return null;

  const token = bearerToken(request);
  if (!token) return null;

  ensureAdminApp(config.projectId);
  try {
    // Standard backend verification validates signature, issuer, audience,
    // expiration, and token shape. Revocation checking is intentionally not
    // enabled here because checkRevoked=true performs an additional Firebase
    // Auth backend lookup for every request and requires broader runtime API
    // access than is needed for the hackathon judge session flow.
    const decoded = await getAuth().verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: typeof decoded.email === 'string' ? decoded.email : null,
    };
  } catch (error: unknown) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: unknown }).code ?? 'unknown')
        : 'unknown';
    console.warn(`Firebase ID token verification failed (${code}).`);
    return null;
  }
}
