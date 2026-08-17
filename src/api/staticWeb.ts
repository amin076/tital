import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type { ServerResponse } from 'node:http';

const CONTENT_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function contentTypeFor(filePath: string): string {
  return CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

function safeCandidatePath(webDistDir: string, relativePath: string): string | null {
  const root = path.resolve(webDistDir);
  const candidate = path.resolve(root, relativePath);
  const rootPrefix = `${root}${path.sep}`;

  if (candidate !== root && !candidate.startsWith(rootPrefix)) {
    return null;
  }

  return candidate;
}

async function isFile(filePath: string): Promise<boolean> {
  try {
    return (await stat(filePath)).isFile();
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

async function sendFile(
  response: ServerResponse,
  filePath: string,
  requestPath: string
): Promise<void> {
  const body = await readFile(filePath);
  response.statusCode = 200;
  response.setHeader('Content-Type', contentTypeFor(filePath));

  if (requestPath.startsWith('/assets/')) {
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (path.basename(filePath) === 'index.html') {
    response.setHeader('Cache-Control', 'no-store');
  } else {
    response.setHeader('Cache-Control', 'public, max-age=3600');
  }

  response.end(body);
}

/**
 * Serve the built Vite application from the same Node process that exposes the
 * Tital API. Unknown extension-less routes fall back to index.html so the web
 * app can use client-side routes without a second hosting service.
 */
export async function tryServeBuiltWebApp(
  response: ServerResponse,
  requestPath: string,
  webDistDir: string
): Promise<boolean> {
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(requestPath);
  } catch {
    return false;
  }

  const relativePath =
    decodedPath === '/' ? 'index.html' : decodedPath.replace(/^\/+/, '');
  const candidate = safeCandidatePath(webDistDir, relativePath);

  if (candidate && (await isFile(candidate))) {
    await sendFile(response, candidate, decodedPath);
    return true;
  }

  // Requests that look like missing static assets should remain 404s rather
  // than returning HTML with a misleading 200 response.
  if (path.extname(relativePath)) return false;

  const indexPath = safeCandidatePath(webDistDir, 'index.html');
  if (!indexPath || !(await isFile(indexPath))) return false;

  await sendFile(response, indexPath, decodedPath);
  return true;
}
