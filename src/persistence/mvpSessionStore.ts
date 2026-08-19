import type { MvpSession } from '../domain/mvpSession.js';

export interface MvpSessionStore {
  readonly description: string;
  save(session: MvpSession): Promise<MvpSession>;
  load(sessionId: string): Promise<MvpSession>;
  list(): Promise<MvpSession[]>;
}
