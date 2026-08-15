import { mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { MvpSessionSchema, type MvpSession } from '../domain/mvpSession.js';

const SAFE_SESSION_ID = /^[A-Za-z0-9_-]+$/;

export function defaultMvpSessionDirectory(): string {
  const configured = process.env.TITAL_SESSION_DIR?.trim();
  return configured || path.resolve(process.cwd(), '.tital', 'sessions');
}

function assertSafeSessionId(sessionId: string): void {
  if (!SAFE_SESSION_ID.test(sessionId)) {
    throw new Error(`Invalid session ID "${sessionId}".`);
  }
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
      return MvpSessionSchema.parse(JSON.parse(raw));
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
