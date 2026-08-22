import { describe, expect, it } from 'vitest';
import {
  publicPersistenceLabel,
  resolvePublicRuntimeMetadata,
} from '../src/api/publicRuntimeMetadata.js';

describe('public runtime metadata', () => {
  it('exposes non-secret Google runtime proof for a Cloud Run release', () => {
    expect(
      resolvePublicRuntimeMetadata({
        PORT: '8080',
        K_SERVICE: 'tital',
        K_REVISION: 'tital-00042-example',
        TITAL_RELEASE_SHA: '0123456789abcdef',
      })
    ).toEqual({
      model: 'gemini-3.5-flash',
      modelPlatform: 'Vertex AI',
      agentFramework: 'Google ADK',
      infrastructure: 'Cloud Run',
      service: 'tital',
      revision: 'tital-00042-example',
      releaseSha: '0123456789abcdef',
    });
  });

  it('does not expose a private bucket path as the persistence label', () => {
    expect(publicPersistenceLabel('gcs://private-bucket/private-prefix')).toBe(
      'Google Cloud Storage'
    );
    expect(publicPersistenceLabel('local-json:/tmp/tital')).toBe('Local JSON');
  });
});
