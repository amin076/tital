import { Storage } from '@google-cloud/storage';
import { MvpSessionSchema, type MvpSession } from '../domain/mvpSession.js';
import {
  assertSafeSessionId,
  normalizeLegacyMvpSessionData,
} from './jsonMvpSessionStore.js';
import type { MvpSessionStore } from './mvpSessionStore.js';

export interface CloudStorageMvpSessionStoreOptions {
  bucketName?: string;
  prefix?: string;
  storage?: Storage;
}

function requiredBucketName(value: string | undefined): string {
  const bucketName = value?.trim();
  if (!bucketName) {
    throw new Error(
      'Cloud session storage requires TITAL_GCS_BUCKET or an explicit bucketName.'
    );
  }
  return bucketName;
}

function normalizePrefix(value: string | undefined): string {
  return (value?.trim() || 'sessions').replace(/^\/+|\/+$/g, '');
}

function isNotFound(error: unknown): boolean {
  const code = (error as { code?: unknown })?.code;
  return code === 404 || code === '404';
}

export class CloudStorageMvpSessionStore implements MvpSessionStore {
  readonly bucketName: string;
  readonly prefix: string;
  readonly description: string;

  private readonly storage: Storage;

  constructor(options: CloudStorageMvpSessionStoreOptions = {}) {
    this.bucketName = requiredBucketName(
      options.bucketName ?? process.env.TITAL_GCS_BUCKET
    );
    this.prefix = normalizePrefix(
      options.prefix ?? process.env.TITAL_GCS_PREFIX
    );
    this.storage = options.storage ?? new Storage();
    this.description = `gcs://${this.bucketName}/${this.prefix}`;
  }

  private objectName(sessionId: string): string {
    assertSafeSessionId(sessionId);
    return this.prefix
      ? `${this.prefix}/${sessionId}.json`
      : `${sessionId}.json`;
  }

  async save(session: MvpSession): Promise<MvpSession> {
    const validated = MvpSessionSchema.parse(session);
    const file = this.storage
      .bucket(this.bucketName)
      .file(this.objectName(validated.id));

    await file.save(`${JSON.stringify(validated, null, 2)}\n`, {
      resumable: false,
      metadata: {
        contentType: 'application/json; charset=utf-8',
        cacheControl: 'no-store',
      },
    });

    return validated;
  }

  async load(sessionId: string): Promise<MvpSession> {
    const file = this.storage
      .bucket(this.bucketName)
      .file(this.objectName(sessionId));

    try {
      const [contents] = await file.download();
      const parsed = JSON.parse(contents.toString('utf8')) as unknown;
      return MvpSessionSchema.parse(normalizeLegacyMvpSessionData(parsed));
    } catch (error: unknown) {
      if (isNotFound(error)) {
        throw new Error(`Tital MVP session "${sessionId}" was not found.`);
      }
      throw error;
    }
  }

  async list(): Promise<MvpSession[]> {
    const objectPrefix = this.prefix ? `${this.prefix}/` : '';
    const [files] = await this.storage.bucket(this.bucketName).getFiles({
      prefix: objectPrefix,
    });

    const sessionIds = files
      .map((file) => file.name)
      .filter((name) => name.startsWith(objectPrefix) && name.endsWith('.json'))
      .map((name) => name.slice(objectPrefix.length, -'.json'.length))
      .filter((sessionId) => sessionId.length > 0 && !sessionId.includes('/'));

    const sessions = await Promise.all(
      sessionIds.map((sessionId) => this.load(sessionId))
    );

    return sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}
