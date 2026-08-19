import { describe, expect, it } from 'vitest';
import { resolveTitalAuthConfig } from '../src/api/auth.js';

describe('resolveTitalAuthConfig', () => {
  it('keeps authentication disabled by default for local development', () => {
    expect(resolveTitalAuthConfig({})).toEqual({
      required: false,
      projectId: '',
      apiKey: '',
      authDomain: '',
    });
  });

  it('resolves Firebase configuration for a public authenticated deployment', () => {
    expect(
      resolveTitalAuthConfig({
        TITAL_AUTH_REQUIRED: 'true',
        GOOGLE_CLOUD_PROJECT: 'tital-project',
        TITAL_FIREBASE_API_KEY: 'public-web-api-key',
        TITAL_FIREBASE_AUTH_DOMAIN: 'tital-project.firebaseapp.com',
      })
    ).toEqual({
      required: true,
      projectId: 'tital-project',
      apiKey: 'public-web-api-key',
      authDomain: 'tital-project.firebaseapp.com',
    });
  });

  it('fails fast when authentication is enabled without complete web config', () => {
    expect(() =>
      resolveTitalAuthConfig({
        TITAL_AUTH_REQUIRED: 'true',
        GOOGLE_CLOUD_PROJECT: 'tital-project',
      })
    ).toThrow(/Firebase web configuration is incomplete/);
  });
});
