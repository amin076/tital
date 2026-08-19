import { createMvpSessionStore } from '../persistence/createMvpSessionStore.js';
import { advanceMvpSession } from '../services/advanceMvpSession.js';
import { createMvpSession } from '../services/createMvpSession.js';
import { reviewMvpSession } from '../services/reviewMvpSession.js';
import { summarizeMvpSession } from '../services/summarizeMvpSession.js';

function usage(): never {
  console.error(`Usage:
  npm run mvp -- start "film idea"
  npm run mvp -- status <session-id>
  npm run mvp -- continue <session-id>
  npm run mvp -- review <session-id> approve|reject [record-id ...]
  npm run mvp -- show <session-id>
  npm run mvp -- list

Review without record IDs applies the decision to every pending record at the current gate.
Supplying record IDs allows selective approval/rejection of current-gate records.`);
  process.exit(1);
}

function print(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

async function main(): Promise<void> {
  const [, , command, ...args] = process.argv;
  if (!command) usage();

  const store = createMvpSessionStore();

  if (command === 'start') {
    const rawIdea = args.join(' ').trim();
    if (!rawIdea) usage();
    const session = await createMvpSession(rawIdea);
    await store.save(session);
    print(summarizeMvpSession(session));
    return;
  }

  if (command === 'list') {
    const sessions = await store.list();
    print(sessions.map(summarizeMvpSession));
    return;
  }

  const sessionId = args[0];
  if (!sessionId) usage();

  if (command === 'status') {
    print(summarizeMvpSession(await store.load(sessionId)));
    return;
  }

  if (command === 'show') {
    print(await store.load(sessionId));
    return;
  }

  if (command === 'continue') {
    const session = await store.load(sessionId);
    const advanced = await advanceMvpSession(session);
    await store.save(advanced);
    print(summarizeMvpSession(advanced));
    return;
  }

  if (command === 'review') {
    const rawDecision = args[1]?.toUpperCase();
    if (rawDecision !== 'APPROVE' && rawDecision !== 'REJECT') usage();
    const recordIds = args.slice(2);
    const session = await store.load(sessionId);
    const reviewed = reviewMvpSession(session, rawDecision, {
      recordIds: recordIds.length > 0 ? recordIds : undefined,
    });
    await store.save(reviewed);
    print(summarizeMvpSession(reviewed));
    return;
  }

  usage();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
