import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import { getConf } from ':config';
import { SQL } from 'sql-template-strings';
import { log } from ':utils';

const {
  SQLITE_FILENAME,
  DEBUG_DB,
  WIPE_DB_ON_STARTUP
} = getConf();
export let db!: Database<sqlite3.Database, sqlite3.Statement>;
if (DEBUG_DB) {
  sqlite3.verbose();
}

async function init() {
  db = await open({
    filename: SQLITE_FILENAME,
    driver: sqlite3.cached.Database
  });
  if (DEBUG_DB) {
    db.on(
      'trace',
      (data: any) => console.log('db.trace:', data)
    );
  }
  await Promise.all([
    createTicketTable(),
    createCheckpointTable(),
    createCommentsTable()
  ]);
}

async function createTicketTable(): Promise<void> {
  if (WIPE_DB_ON_STARTUP) {
    await db.exec('DROP TABLE IF EXISTS tickets;');
  }
  const sql = SQL`
    CREATE TABLE IF NOT EXISTS tickets (
      stellar_case_id TEXT NOT NULL,
      stellar_case_number INTEGER NOT NULL,
      stellar_tenant_id TEXT,
      stellar_last_modified INTEGER,
      remote_ticket_id INTEGER NOT NULL,
      remote_ticket_last_modified INTEGER NOT NULL,
      state TEXT,
      ts INTEGER,
      instance_key TEXT,
      PRIMARY KEY (stellar_case_id, instance_key)
    );
    CREATE INDEX IF NOT EXISTS idx_tickets_stellar_case_number ON tickets (stellar_case_number);
    CREATE INDEX IF NOT EXISTS idx_tickets_remote_ticket_id ON tickets (remote_ticket_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_state ON tickets (state);
  `;
  await db.exec(sql);
}

async function createCheckpointTable(): Promise<void> {
  if (WIPE_DB_ON_STARTUP) {
    await db.exec('DROP TABLE IF EXISTS checkpoint;');
  }
  const sql = SQL`
    CREATE TABLE IF NOT EXISTS checkpoint (
      instance_key TEXT PRIMARY KEY,
      checkpoint INTEGER
    );
  `;
  await db.exec(sql);
}

async function createCommentsTable(): Promise<void> {
  if (WIPE_DB_ON_STARTUP) {
    await db.exec('DROP TABLE IF EXISTS comments;');
  }
  const sql = SQL`
    CREATE TABLE IF NOT EXISTS comments (
      instance_key TEXT,
      stellar_case_id TEXT NOT NULL,
      halopsa_ticket_id INTEGER,
      stellar_comment_id TEXT NOT NULL,
      halopsa_action_id INTEGER,
      system_comment BOOLEAN NOT NULL,
      PRIMARY KEY (instance_key, stellar_case_id, stellar_comment_id),
      FOREIGN KEY (instance_key, stellar_case_id) REFERENCES tickets(instance_key, stellar_case_id) ON DELETE CASCADE
    );
  `;
  await db.exec(sql);
}

await init();
