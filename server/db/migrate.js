// OWNER: Celestin — shared file, say something in the group chat before changing it.
//
// Drops every table, rebuilds them from schema.sql, and inserts the demo data.
//
//   npm run db:reset
//
// Safe to run whenever the database gets into a state you do not like. It is
// also what the tests call between test cases, through resetStore().

import { readFileSync } from 'node:fs';
import { db, SCHEMA_PATH, DB_PATH } from './connection.js';
import { seed } from './seed.js';

/**
 * Rebuilds the database from scratch.
 *
 * schema.sql starts with its own DROP statements, so this works whether the
 * file already exists or not.
 */
export function rebuild() {
  const schema = readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);
  seed(db);
}

// Only runs when this file is executed directly, not when it is imported.
// That is what lets the tests import rebuild() without printing anything.
const runDirectly = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());

if (runDirectly) {
  rebuild();

  const count = (table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;

  console.log(`QueueSmart database rebuilt at ${DB_PATH}`);
  console.log(`  users         ${count('UserCredentials')}`);
  console.log(`  services      ${count('Service')}`);
  console.log(`  queues        ${count('Queue')}`);
  console.log(`  queue entries ${count('QueueEntry')}`);
  console.log(`  notifications ${count('Notification')}`);
  console.log(`  history rows  ${count('History')}`);
}

export default rebuild;
