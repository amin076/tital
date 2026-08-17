import { describe, expect, it } from 'vitest';
import { CloudStorageMvpSessionStore } from '../src/persistence/cloudStorageMvpSessionStore.js';
import { createMvpSessionStore } from '../src/persistence/createMvpSessionStore.js';
import { JsonMvpSessionStore } from '../src/persistence/jsonMvpSessionStore.js';

describe('createMvpSessionStore', () => {
  it('uses the local JSON store when no Cloud Storage bucket is configured', () => {
    const store = createMvpSessionStore({
      TITAL_SESSION_DIR: 'tmp/test-sessions',
    });

    expect(store).toBeInstanceOf(JsonMvpSessionStore);
    expect(store.description).toContain('tmp/test-sessions');
  });

  it('uses Cloud Storage when TITAL_GCS_BUCKET is configured', () => {
    const store = createMvpSessionStore({
      TITAL_GCS_BUCKET: 'tital-test-bucket',
      TITAL_GCS_PREFIX: 'demo/sessions',
    });

    expect(store).toBeInstanceOf(CloudStorageMvpSessionStore);
    expect(store.description).toBe(
      'gcs://tital-test-bucket/demo/sessions'
    );
  });
});
