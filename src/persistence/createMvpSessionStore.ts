import path from 'node:path';
import { CloudStorageMvpSessionStore } from './cloudStorageMvpSessionStore.js';
import { JsonMvpSessionStore } from './jsonMvpSessionStore.js';
import type { MvpSessionStore } from './mvpSessionStore.js';

export interface MvpSessionStoreScope {
  prefixSuffix?: string;
}

function normalizedSuffix(value?: string): string {
  return value?.trim().replace(/^\/+|\/+$/g, '') || '';
}

export function createMvpSessionStore(
  env: NodeJS.ProcessEnv = process.env,
  scope: MvpSessionStoreScope = {}
): MvpSessionStore {
  const suffix = normalizedSuffix(scope.prefixSuffix);
  const bucketName = env.TITAL_GCS_BUCKET?.trim();
  if (bucketName) {
    const basePrefix = env.TITAL_GCS_PREFIX?.trim().replace(/^\/+|\/+$/g, '') || 'sessions';
    return new CloudStorageMvpSessionStore({
      bucketName,
      prefix: suffix ? `${basePrefix}/${suffix}` : basePrefix,
    });
  }

  const directory = env.TITAL_SESSION_DIR?.trim();
  const baseDirectory = directory || undefined;
  if (!suffix) {
    return baseDirectory
      ? new JsonMvpSessionStore(baseDirectory)
      : new JsonMvpSessionStore();
  }

  const scopedDirectory = path.join(baseDirectory || '.tital/sessions', suffix);
  return new JsonMvpSessionStore(scopedDirectory);
}
