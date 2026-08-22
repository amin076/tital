import { TITAL_GEMINI_MODEL } from '../config/models.js';
import { resolveRuntimeBackend } from '../services/resolveRuntimeAuditMetadata.js';

export interface PublicRuntimeMetadata {
  provider: 'Google';
  backend: string;
  model: typeof TITAL_GEMINI_MODEL;
  modelIdentifier: typeof TITAL_GEMINI_MODEL;
  modelPlatform: 'Vertex AI';
  agentFramework: 'Google ADK';
  infrastructure: 'Cloud Run' | 'Local Node.js';
  service: string | null;
  revision: string | null;
  releaseSha: string | null;
}

function trimmed(env: NodeJS.ProcessEnv, key: string): string | null {
  return env[key]?.trim() || null;
}

export function resolvePublicRuntimeMetadata(
  env: NodeJS.ProcessEnv = process.env
): PublicRuntimeMetadata {
  const service = trimmed(env, 'K_SERVICE');
  const revision = trimmed(env, 'K_REVISION');
  const releaseSha = trimmed(env, 'TITAL_RELEASE_SHA');

  return {
    provider: 'Google',
    backend: resolveRuntimeBackend(env),
    model: TITAL_GEMINI_MODEL,
    modelIdentifier: TITAL_GEMINI_MODEL,
    modelPlatform: 'Vertex AI',
    agentFramework: 'Google ADK',
    infrastructure: service || env.PORT ? 'Cloud Run' : 'Local Node.js',
    service,
    revision,
    releaseSha,
  };
}

export function publicPersistenceLabel(description: string): string {
  return description.startsWith('gcs://') ? 'Google Cloud Storage' : 'Local JSON';
}
