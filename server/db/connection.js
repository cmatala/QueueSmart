// OWNER: Celestin — shared file, say something in the group chat before changing it.
//
// Opens the SQLite database and hands the same connection to everyone.
//
// better-sqlite3 is synchronous: db.prepare(...).get() returns the row, not a
// promise. That is why nothing in A4 had to become async, and why all of our
// A3 tests still work with await nowhere in sight.

import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

// Vitest runs each test file in its own worker, in parallel. If they all
// opened the same file, one test's resetStore() would wipe the data another
// test was in the middle of using, and we would get failures that move around
// between runs. Giving each worker its own database file keeps them isolated
// without having to turn parallelism off.
const worker = process.env.VITEST_WORKER_ID;
const fileName = worker ? `queuesmart.test-${worker}.db` : 'queuesmart.db';

// The database sits at the project root, next to package.json.
// Both names are in .gitignore: everyone builds their own with npm run db:reset.
export const DB_PATH = process.env.QS_DB ?? join(here, '..', '..', fileName);

export const SCHEMA_PATH = join(here, 'schema.sql');

export const db = new Database(DB_PATH);

// Foreign keys are OFF by default in SQLite, which surprises everyone once.
// Without this line, a queue entry could reference a user who does not exist
// and the database would happily accept it.
db.pragma('foreign_keys = ON');

// Lets reads carry on while a write is in progress. Useful when the test
// runner and a dev server are both touching the file.
db.pragma('journal_mode = WAL');

export default db;
