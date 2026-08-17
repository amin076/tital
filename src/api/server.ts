import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { z } from 'zod';
import { JsonMvpSessionStore } from '../persistence/jsonMvpSessionStore.js';
import { advanceMvpSession } from '../services/advanceMvpSession.js';
import { createMvpSession } from '../services/createMvpSession.js';
import { getMvpSessionView } from '../services/getMvpSessionView.js';
import { reviewMvpSession } from '../services/reviewMvpSession.js';
import { summarizeMvpSession } from '../services/summarizeMvpSession.js';
import { resolveTitalServerConfig } from './runtimeConfig.js';
import { tryServeBuiltWebApp } from './staticWeb.js';

const CreateSessionRequestSchema = z.object({
  rawIdea: z.string().trim().min(1).max(5000),
});

const ReviewRequestSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  recordIds: z.array(z.string().min(1)).optional(),
});

const config = resolveTitalServerConfig();
const store = new JsonMvpSessionStore();

class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    message: string
  ) {
    super(message);
  }
}

function applyCommonHeaders(response: ServerResponse): void {
  response.setHeader('Cache-Control', 'no-store');
  if (config.webOrigin) {
    response.setHeader('Access-Control-Allow-Origin', config.webOrigin);
    response.setHeader('Vary', 'Origin');
  }
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  body: unknown
): void {
  applyCommonHeaders(response);
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(`${JSON.stringify(body, null, 2)}\n`);
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 1_000_000) {
      throw new HttpError(413, 'Request body is too large.');
    }
    chunks.push(buffer);
  }

  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString('utf8');

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON.');
  }
}

function sessionIdFrom(match: RegExpMatchArray): string {
  try {
    return decodeURIComponent(match[1]);
  } catch {
    throw new HttpError(400, 'Session ID is not valid URL encoding.');
  }
}

async function loadSessionOr404(sessionId: string) {
  try {
    return await store.load(sessionId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('was not found')) {
      throw new HttpError(404, message);
    }
    throw error;
  }
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  if (request.method === 'OPTIONS') {
    applyCommonHeaders(response);
    response.statusCode = 204;
    response.end();
    return;
  }

  const url = new URL(
    request.url ?? '/',
    `http://${request.headers.host ?? `${config.host}:${config.port}`}`
  );

  if (request.method === 'GET' && url.pathname === '/api/health') {
    sendJson(response, 200, {
      status: 'ok',
      service: 'tital-api',
      web: 'same-origin',
    });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/sessions') {
    const sessions = await store.list();
    sendJson(response, 200, sessions.map(summarizeMvpSession));
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/sessions') {
    const body = CreateSessionRequestSchema.parse(await readJson(request));
    const session = await createMvpSession(body.rawIdea);
    await store.save(session);
    sendJson(response, 201, getMvpSessionView(session));
    return;
  }

  const reviewMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)\/review$/);
  if (request.method === 'POST' && reviewMatch) {
    const sessionId = sessionIdFrom(reviewMatch);
    const body = ReviewRequestSchema.parse(await readJson(request));
    const session = await loadSessionOr404(sessionId);

    let reviewed;
    try {
      reviewed = reviewMvpSession(session, body.decision, {
        recordIds: body.recordIds,
      });
    } catch (error: unknown) {
      throw new HttpError(
        400,
        error instanceof Error ? error.message : String(error)
      );
    }

    await store.save(reviewed);
    sendJson(response, 200, getMvpSessionView(reviewed));
    return;
  }

  const continueMatch = url.pathname.match(
    /^\/api\/sessions\/([^/]+)\/continue$/
  );
  if (request.method === 'POST' && continueMatch) {
    const sessionId = sessionIdFrom(continueMatch);
    const session = await loadSessionOr404(sessionId);
    const advanced = await advanceMvpSession(session);
    await store.save(advanced);
    sendJson(response, 200, getMvpSessionView(advanced));
    return;
  }

  const sessionMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)$/);
  if (request.method === 'GET' && sessionMatch) {
    const sessionId = sessionIdFrom(sessionMatch);
    const session = await loadSessionOr404(sessionId);
    sendJson(response, 200, getMvpSessionView(session));
    return;
  }

  if (
    request.method === 'GET' &&
    !url.pathname.startsWith('/api/') &&
    (await tryServeBuiltWebApp(response, url.pathname, config.webDistDir))
  ) {
    return;
  }

  throw new HttpError(
    404,
    `Route ${request.method ?? 'UNKNOWN'} ${url.pathname} was not found.`
  );
}

const server = createServer((request, response) => {
  handleRequest(request, response).catch((error: unknown) => {
    if (error instanceof z.ZodError) {
      sendJson(response, 400, {
        error: 'Request validation failed.',
        issues: error.issues,
      });
      return;
    }

    if (error instanceof HttpError) {
      sendJson(response, error.statusCode, { error: error.message });
      return;
    }

    console.error(error);
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : String(error),
    });
  });
});

server.listen(config.port, config.host, () => {
  console.log(`Tital listening on http://${config.host}:${config.port}`);
  console.log(`Session directory: ${store.directory}`);
  console.log(`Web build directory: ${config.webDistDir}`);
});
