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

-- Notes feature tables
CREATE TABLE IF NOT EXISTS folders (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  name       TEXT NOT NULL,
  parent_id  TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notes (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  title      TEXT NOT NULL DEFAULT 'Untitled',
  content    TEXT DEFAULT '',
  folder_id  TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id      TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS note_tags (
  note_id TEXT NOT NULL,
  tag_id  TEXT NOT NULL,
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_habits_user      ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_user        ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_exp     ON sessions(expires);
CREATE INDEX IF NOT EXISTS idx_folders_user     ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user       ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_folder     ON notes(folder_id);
CREATE INDEX IF NOT EXISTS idx_tags_user        ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_note   ON note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag    ON note_tags(tag_id);