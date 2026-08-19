import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveTitalServerConfig } from '../src/api/runtimeConfig.js';

describe('resolveTitalServerConfig', () => {
  const cwd = path.resolve('tmp-tital-project');

  it('keeps local development on loopback and the existing development port', () => {
    const config = resolveTitalServerConfig({}, cwd);

    expect(config).toEqual({
      host: '127.0.0.1',
      port: 8787,
      webOrigin: 'http://127.0.0.1:5173',
      webDistDir: path.resolve(cwd, 'apps', 'web', 'dist'),
    });
  });

  it('uses the Cloud Run PORT contract and listens on all interfaces', () => {
    const config = resolveTitalServerConfig({ PORT: '8080' }, cwd);

    expect(config.host).toBe('0.0.0.0');
    expect(config.port).toBe(8080);
    expect(config.webOrigin).toBeNull();
  });

  it('allows explicit Tital runtime overrides', () => {
    const customWebDir = path.resolve(cwd, 'custom-web');
    const config = resolveTitalServerConfig(
      {
        PORT: '8080',
        TITAL_API_HOST: '127.0.0.2',
        TITAL_API_PORT: '9000',
        TITAL_WEB_ORIGIN: 'https://example.test',
        TITAL_WEB_DIST_DIR: customWebDir,
      },
      cwd
    );

    expect(config).toEqual({
      host: '127.0.0.2',
      port: 9000,
      webOrigin: 'https://example.test',
      webDistDir: customWebDir,
    });
  });

  it('rejects invalid ports before the HTTP server starts', () => {
    expect(() =>
      resolveTitalServerConfig({ PORT: 'not-a-port' }, cwd)
    ).toThrow('Invalid server port');

    expect(() => resolveTitalServerConfig({ PORT: '70000' }, cwd)).toThrow(
      'Invalid server port'
    );
  });
});
