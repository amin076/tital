import { TITAL_GEMINI_MODEL } from '../config/models.js';
import type { RuntimeAuditMetadata } from '../domain/runtimeAuditMetadata.js';

function trimmed(env: NodeJS.ProcessEnv, key: string): string | null {
  return env[key]?.trim() || null;
}

export function resolveRuntimeBackend(env: NodeJS.ProcessEnv = process.env): string {
  return env.GOOGLE_GENAI_USE_VERTEXAI === 'true' ? 'VERTEX_AI' : 'GOOGLE_AI';
}

export function resolveRuntimeAuditMetadata(
  env: NodeJS.ProcessEnv = process.env,
  now: () => string = () => new Date().toISOString()
): RuntimeAuditMetadata {
  return {
    provider: 'Google',
    backend: resolveRuntimeBackend(env),
    modelIdentifier: TITAL_GEMINI_MODEL,
    agentFramework: 'Google ADK',
    modelPlatform: 'Vertex AI',
    cloudRunRevision: trimmed(env, 'K_REVISION'),
    cloudRunService: trimmed(env, 'K_SERVICE'),
    releaseSha: trimmed(env, 'TITAL_RELEASE_SHA'),
    executionTimestamp: now(),
  };
}
