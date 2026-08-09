-- schema.sql — creates all HabitGrid tables
CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  username     TEXT UNIQUE NOT NULL COLLATE NOCASE,
  display_name TEXT NOT NULL,
  pic          TEXT DEFAULT '',
  pass_hash    TEXT NOT NULL,
  salt         TEXT NOT NULL,
  created_at   TEXT DEFAULT (datetime('now')),
  last_login   TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  expires    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS habits (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  name       TEXT NOT NULL,
  emoji      TEXT DEFAULT '🌱',
  color      TEXT DEFAULT '#1f8a5b',
  target     INTEGER DEFAULT 100,
  start_date TEXT NOT NULL,
  status     TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS logs (
  date     TEXT NOT NULL,
  habit_id TEXT NOT NULL,
  user_id  TEXT NOT NULL,
  done     INTEGER DEFAULT 0,
  note     TEXT DEFAULT '',
  PRIMARY KEY (date, habit_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_habits_user    ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_user      ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_exp   ON sessions(expires);