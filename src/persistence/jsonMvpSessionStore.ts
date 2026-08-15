import { mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { MvpSessionSchema, type MvpSession } from '../domain/mvpSession.js';

const SAFE_SESSION_ID = /^[A-Za-z0-9_-]+$/;
const LEGACY_SEMANTIC_NULLS = new Set([
  'null',
  'none',
  'n/a',
  'na',
  'unknown',
  'no uncertainty',
]);

export function defaultMvpSessionDirectory(): string {
  const configured = process.env.TITAL_SESSION_DIR?.trim();
  return configured || path.resolve(process.cwd(), '.tital', 'sessions');
}

function assertSafeSessionId(sessionId: string): void {
  if (!SAFE_SESSION_ID.test(sessionId)) {
    throw new Error(`Invalid session ID "${sessionId}".`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Read-time compatibility migration for sessions written before evidence
 * uncertainty validation was hardened. It only repairs known legacy placeholder
 * strings in state.evidence[*].uncertainty; all other values remain untouched
 * and are still validated by MvpSessionSchema afterwards.
 */
export function normalizeLegacyMvpSessionData(value: unknown): unknown {
  if (!isRecord(value) || !isRecord(value.state) || !Array.isArray(value.state.evidence)) {
    return value;
  }

  let changed = false;
  const evidence = value.state.evidence.map((item) => {
    if (!isRecord(item) || typeof item.uncertainty !== 'string') return item;

    const normalized = item.uncertainty.trim().toLowerCase();
    if (!LEGACY_SEMANTIC_NULLS.has(normalized)) return item;

    changed = true;
    return { ...item, uncertainty: null };
  });

  if (!changed) return value;

  return {
    ...value,
    state: {
      ...value.state,
      evidence,
    },
  };
}

export class JsonMvpSessionStore {
  constructor(readonly directory: string = defaultMvpSessionDirectory()) {}

  private filePath(sessionId: string): string {
    assertSafeSessionId(sessionId);
    return path.join(this.directory, `${sessionId}.json`);
  }

  async save(session: MvpSession): Promise<MvpSession> {
    const validated = MvpSessionSchema.parse(session);
    await mkdir(this.directory, { recursive: true });

    const target = this.filePath(validated.id);
    const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(validated, null, 2)}\n`, 'utf8');
    await rename(temporary, target);
    return validated;
  }

  async load(sessionId: string): Promise<MvpSession> {
    const target = this.filePath(sessionId);
    try {
      const raw = await readFile(target, 'utf8');
      const parsed = JSON.parse(raw) as unknown;
      return MvpSessionSchema.parse(normalizeLegacyMvpSessionData(parsed));
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Tital MVP session "${sessionId}" was not found.`);
      }
      throw error;
    }
  }

  async list(): Promise<MvpSession[]> {
    let names: string[];
    try {
      names = await readdir(this.directory);
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }

    const sessions: MvpSession[] = [];
    for (const name of names.filter((value) => value.endsWith('.json'))) {
      const sessionId = name.slice(0, -'.json'.length);
      sessions.push(await this.load(sessionId));
    }

    return sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}
