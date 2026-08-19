import path from 'node:path';

export interface TitalServerConfig {
  host: string;
  port: number;
  webOrigin: string | null;
  webDistDir: string;
}

function readTrimmed(
  env: NodeJS.ProcessEnv,
  key: string
): string | undefined {
  const value = env[key]?.trim();
  return value ? value : undefined;
}

function parsePort(raw: string): number {
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`Invalid server port "${raw}".`);
  }
  return port;
}

export function resolveTitalServerConfig(
  env: NodeJS.ProcessEnv = process.env,
  cwd: string = process.cwd()
): TitalServerConfig {
  const cloudRunPort = readTrimmed(env, 'PORT');
  const isManagedContainer = Boolean(cloudRunPort);

  const host =
    readTrimmed(env, 'TITAL_API_HOST') ??
    (isManagedContainer ? '0.0.0.0' : '127.0.0.1');

  const port = parsePort(
    readTrimmed(env, 'TITAL_API_PORT') ?? cloudRunPort ?? '8787'
  );

  const webOrigin =
    readTrimmed(env, 'TITAL_WEB_ORIGIN') ??
    (isManagedContainer ? null : 'http://127.0.0.1:5173');

  const webDistDir =
    readTrimmed(env, 'TITAL_WEB_DIST_DIR') ??
    path.resolve(cwd, 'apps', 'web', 'dist');

  return {
    host,
    port,
    webOrigin,
    webDistDir,
  };
}
