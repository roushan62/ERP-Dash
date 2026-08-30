'use strict';

/**
 * VyaparBooks migration handler.
 *
 * Migrations are applied in order and recorded in schema_migrations.
 * Every migration is a function that receives the open better-sqlite3
 * Database connection and runs synchronous statements. This keeps upgrades
 * (on future releases) safe for existing user data.
 */
const fs = require('fs');
const path = require('path');

const SCHEMA_VERSION = 1;

// Ordered list of migrations. Add new entries for future versions.
const migrations = [
  {
    version: 1,
    name: 'initial_schema',
    up(db) {
      const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      db.exec(schema);
    },
  },
];

function getCurrentVersion(db) {
  try {
    const row = db.prepare('SELECT MAX(version) AS v FROM schema_migrations').get();
    return row && row.v ? row.v : 0;
  } catch (_) {
    return 0;
  }
}

function migrate(db) {
  const current = getCurrentVersion(db);
  const pending = migrations
    .filter((m) => m.version > current)
    .sort((a, b) => a.version - b.version);

  for (const m of pending) {
    const tx = db.transaction(() => {
      m.up(db);
      db.prepare('INSERT OR IGNORE INTO schema_migrations (version) VALUES (?)').run(m.version);
    });
    tx();
  }
  return pending.length;
}

module.exports = { migrate, migrations, SCHEMA_VERSION };
