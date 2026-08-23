import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { z } from 'zod';
import { FilmProjectInputSchema } from '../domain/filmProjectInput.js';
import { createMvpSessionStore } from '../persistence/createMvpSessionStore.js';
import type { MvpSessionStore } from '../persistence/mvpSessionStore.js';
import {
  advanceMvpSession,
  MvpSessionAdvanceError,
} from '../services/advanceMvpSession.js';
import { assistMvpReview } from '../services/assistMvpReview.js';
import { createMvpSession } from '../services/createMvpSession.js';
import {
  createPublicDemoSession,
  PUBLIC_DEMO_SESSION_ID,
} from '../services/createPublicDemoSession.js';
import { getMvpSessionView } from '../services/getMvpSessionView.js';
import {
  GapResolutionRequiredError,
  resolveMvpReview,
} from '../services/resolveMvpReview.js';
import { summarizeMvpSession } from '../services/summarizeMvpSession.js';
import {
  authenticateRequest,
  resolveTitalAuthConfig,
  type AuthenticatedUser,
} from './auth.js';
import { resolveTitalServerConfig } from './runtimeConfig.js';
import {
  publicPersistenceLabel,
  resolvePublicRuntimeMetadata,
} from './publicRuntimeMetadata.js';
import { tryServeBuiltWebApp } from './staticWeb.js';

const ReviewRequestSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  recordIds: z.array(z.string().min(1)).optional(),
  gapResolution: z.enum(['RETRY', 'WAIVE']).optional(),
  reason: z.string().trim().max(1000).optional(),
  rememberInstruction: z.boolean().optional(),
});

const config = resolveTitalServerConfig();
const authConfig = resolveTitalAuthConfig();
const baseStore = createMvpSessionStore();
const demoSessionId = process.env.TITAL_DEMO_SESSION_ID?.trim() || PUBLIC_DEMO_SESSION_ID;
const publicRuntime = resolvePublicRuntimeMetadata();

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
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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

async function loadSessionOr404(store: MvpSessionStore, sessionId: string) {
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

async function publicDemoAvailable(): Promise<boolean> {
  try {
    await baseStore.load(demoSessionId);
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('was not found')) return false;
    throw error;
  }
}

function userStore(user: AuthenticatedUser | null): MvpSessionStore {
  if (!authConfig.required) return baseStore;
  if (!user) throw new HttpError(401, 'Authentication is required.');
  return createMvpSessionStore(process.env, {
    prefixSuffix: `users/${user.uid}`,
  });
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
      persistence: publicPersistenceLabel(baseStore.description),
      authRequired: authConfig.required,
      demoAvailable: await publicDemoAvailable(),
      runtime: publicRuntime,
    });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/public/config') {
    sendJson(response, 200, {
      authRequired: authConfig.required,
      firebase: authConfig.required
        ? {
            projectId: authConfig.projectId,
            apiKey: authConfig.apiKey,
            authDomain: authConfig.authDomain,
          }
        : null,
      demoAvailable: await publicDemoAvailable(),
      runtime: publicRuntime,
    });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/public/demo') {
    const session = await loadSessionOr404(baseStore, demoSessionId);
    sendJson(response, 200, getMvpSessionView(session));
    return;
  }

  const user = await authenticateRequest(request, authConfig);
  const store = url.pathname.startsWith('/api/sessions') ? userStore(user) : baseStore;

  if (request.method === 'GET' && url.pathname === '/api/sessions') {
    const sessions = await store.list();
    sendJson(response, 200, sessions.map(summarizeMvpSession));
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/sessions') {
    const projectInput = FilmProjectInputSchema.parse(await readJson(request));
    const session = await createMvpSession(projectInput);
    await store.save(session);
    sendJson(response, 201, getMvpSessionView(session));
    return;
  }

  const reviewMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)\/review$/);
  if (request.method === 'POST' && reviewMatch) {
    const sessionId = sessionIdFrom(reviewMatch);
    const body = ReviewRequestSchema.parse(await readJson(request));
    const session = await loadSessionOr404(store, sessionId);

    let reviewed;
    try {
      reviewed = await resolveMvpReview(session, body.decision, {
        recordIds: body.recordIds,
        gapResolution: body.gapResolution,
        reason: body.reason,
        rememberInstruction: body.rememberInstruction,
      });
    } catch (error: unknown) {
      if (error instanceof GapResolutionRequiredError) {
        sendJson(response, 409, {
          error: error.message,
          code: 'GAP_RESOLUTION_REQUIRED',
          gaps: error.groups,
        });
        return;
      }
      throw new HttpError(
        400,
        error instanceof Error ? error.message : String(error)
      );
    }

    await store.save(reviewed);
    sendJson(response, 200, getMvpSessionView(reviewed));
    return;
  }

  const reviewAssistMatch = url.pathname.match(
    /^\/api\/sessions\/([^/]+)\/review-assist$/
  );
  if (request.method === 'POST' && reviewAssistMatch) {
    const sessionId = sessionIdFrom(reviewAssistMatch);
    const session = await loadSessionOr404(store, sessionId);
    try {
      const assisted = await assistMvpReview(session);
      await store.save(assisted);
      sendJson(response, 200, getMvpSessionView(assisted));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('currently available only')) {
        throw new HttpError(409, message);
      }
      throw error;
    }
    return;
  }

  const publishDemoMatch = url.pathname.match(
    /^\/api\/sessions\/([^/]+)\/publish-demo$/
  );
  if (request.method === 'POST' && publishDemoMatch) {
    const sessionId = sessionIdFrom(publishDemoMatch);
    const source = await loadSessionOr404(store, sessionId);
    let snapshot;
    try {
      snapshot = createPublicDemoSession(source);
    } catch (error: unknown) {
      throw new HttpError(400, error instanceof Error ? error.message : String(error));
    }
    await baseStore.save(snapshot);
    sendJson(response, 200, getMvpSessionView(snapshot));
    return;
  }

  const continueMatch = url.pathname.match(
    /^\/api\/sessions\/([^/]+)\/continue$/
  );
  if (request.method === 'POST' && continueMatch) {
    const sessionId = sessionIdFrom(continueMatch);
    const session = await loadSessionOr404(store, sessionId);
    try {
      const advanced = await advanceMvpSession(session);
      await store.save(advanced);
      sendJson(response, 200, getMvpSessionView(advanced));
    } catch (error) {
      if (error instanceof MvpSessionAdvanceError) {
        await store.save(error.session);
        sendJson(response, error.statusCode, {
          error: error.message,
          code: error.code,
        });
        return;
      }
      throw error;
    }
    return;
  }

  const sessionMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)$/);
  if (request.method === 'GET' && sessionMatch) {
    const sessionId = sessionIdFrom(sessionMatch);
    const session = await loadSessionOr404(store, sessionId);
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
  console.log(`Session store: ${baseStore.description}`);
  console.log(`Authentication required: ${authConfig.required}`);
  console.log(`Public demo ID: ${demoSessionId}`);
  console.log(`Web build directory: ${config.webDistDir}`);
});
