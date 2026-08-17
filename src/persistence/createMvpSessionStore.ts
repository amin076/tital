import { CloudStorageMvpSessionStore } from './cloudStorageMvpSessionStore.js';
import { JsonMvpSessionStore } from './jsonMvpSessionStore.js';
import type { MvpSessionStore } from './mvpSessionStore.js';

export function createMvpSessionStore(
  env: NodeJS.ProcessEnv = process.env
): MvpSessionStore {
  const bucketName = env.TITAL_GCS_BUCKET?.trim();
  if (bucketName) {
    return new CloudStorageMvpSessionStore({
      bucketName,
      prefix: env.TITAL_GCS_PREFIX,
    });
  }

  const directory = env.TITAL_SESSION_DIR?.trim();
  return directory
    ? new JsonMvpSessionStore(directory)
    : new JsonMvpSessionStore();
}
