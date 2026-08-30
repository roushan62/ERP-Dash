'use strict';

/**
 * VyaparBooks - SQLite database bootstrap.
 *
 * The database is created on first run inside the OS user-data directory
 * (Electron app.getPath('userData') when running inside Electron, otherwise
 * `~/.vyaparbooks` or $VYAPAR_DATA_DIR). The user owns all data locally.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const Database = require('better-sqlite3');
const { migrate } = require('./migrations');

let dbInstance = null;
let dbPath = null;

function resolveDataDir() {
  try {
    // When running inside Electron the main process passes the userData path
    // via process.env.VYAPAR_USER_DATA so the same module works in Node tests.
    if (process.env.VYAPAR_USER_DATA) return process.env.VYAPAR_USER_DATA;
  } catch (_) { /* ignore */ }

  if (process.env.VYAPAR_DATA_DIR) return process.env.VYAPAR_DATA_DIR;
  return path.join(os.homedir(), '.vyaparbooks');
}

function resolveDbPath() {
  if (process.env.VYAPAR_DB_PATH) return process.env.VYAPAR_DB_PATH;
  const dir = resolveDataDir();
  return path.join(dir, 'vyaparbooks.db');
}

/**
 * Opens (and if needed creates) the database and applies migrations.
 * Returns the same singleton on subsequent calls.
 */
function open() {
  if (dbInstance) return dbInstance;

  dbPath = resolveDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');

  try {
    migrate(db);
  } catch (err) {
    db.close();
    throw err;
  }

  dbInstance = db;
  return db;
}

function getDb() {
  return open();
}

function getPath() {
  open();
  return dbPath;
}

function close() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    dbPath = null;
  }
}

module.exports = { open, getDb, getPath, close, resolveDbPath };
