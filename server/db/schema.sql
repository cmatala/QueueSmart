-- OWNER: Celestin — shared file, say something in the group chat before changing it.
--
-- The whole QueueSmart schema. Running this drops everything and rebuilds it,
-- so it is safe to run any time: npm run db:reset
--
-- Two rules we follow throughout:
--   1. Every rule the server checks is also a constraint here. If our code has
--      a bug, the database still refuses the bad row.
--   2. Drops go in reverse dependency order, or the foreign keys block them.

PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS History;
DROP TABLE IF EXISTS Notification;
DROP TABLE IF EXISTS QueueEntry;
DROP TABLE IF EXISTS Queue;
DROP TABLE IF EXISTS Service;
DROP TABLE IF EXISTS UserProfile;
DROP TABLE IF EXISTS UserCredentials;

-- ---------------------------------------------------------------- users

-- Sign-in details only. Personal details live in UserProfile.
CREATE TABLE UserCredentials (
  user_id       TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),

  CHECK (length(email) BETWEEN 3 AND 255),

  -- A bcrypt hash is always 60 characters. A plain-text password never is.
  -- This makes "passwords must be encrypted" a rule the database enforces,
  -- not just a promise our code makes.
  CHECK (length(password_hash) >= 55)
);

-- Everything about a person that is not their sign-in.
CREATE TABLE UserProfile (
  user_id   TEXT PRIMARY KEY
            REFERENCES UserCredentials(user_id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK (length(trim(full_name)) BETWEEN 1 AND 100),
  phone     TEXT,
  notify_by TEXT NOT NULL DEFAULT 'app'
            CHECK (notify_by IN ('app', 'email', 'sms'))
);

-- ---------------------------------------------------------------- services

CREATE TABLE Service (
  service_id        TEXT PRIMARY KEY,
  name              TEXT NOT NULL UNIQUE
                    CHECK (length(trim(name)) BETWEEN 1 AND 100),
  description       TEXT NOT NULL CHECK (length(trim(description)) >= 1),
  expected_duration INTEGER NOT NULL CHECK (expected_duration > 0),
  priority          TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high'))
);

-- One queue per service. The UNIQUE on service_id is what enforces that.
CREATE TABLE Queue (
  queue_id   TEXT PRIMARY KEY,
  service_id TEXT NOT NULL UNIQUE
             REFERENCES Service(service_id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- ---------------------------------------------------------------- the queue

CREATE TABLE QueueEntry (
  entry_id  TEXT PRIMARY KEY,
  queue_id  TEXT NOT NULL REFERENCES Queue(queue_id) ON DELETE CASCADE,
  user_id   TEXT NOT NULL REFERENCES UserCredentials(user_id) ON DELETE CASCADE,
  position  INTEGER NOT NULL CHECK (position > 0),
  joined_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  status    TEXT NOT NULL DEFAULT 'waiting'
            CHECK (status IN ('waiting', 'served', 'left', 'no-show'))
);

-- Serving order is read constantly, so give it an index.
-- Deliberately NOT unique: swapping two positions needs a moment where both
-- rows hold the same number, and a unique index would reject the first update.
CREATE INDEX idx_entry_order ON QueueEntry (queue_id, position);

-- The A1 rule "one person, one queue at a time", enforced by the database.
-- A partial index: it only applies to rows still waiting, so a user can have
-- any number of served or left entries in their past.
CREATE UNIQUE INDEX idx_one_live_entry_per_user
  ON QueueEntry (user_id) WHERE status = 'waiting';

-- ---------------------------------------------------- notifications & history

CREATE TABLE Notification (
  notification_id TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL
                  REFERENCES UserCredentials(user_id) ON DELETE CASCADE,
  message         TEXT NOT NULL
                  CHECK (length(trim(message)) BETWEEN 1 AND 500),
  created_at      TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  status          TEXT NOT NULL DEFAULT 'sent'
                  CHECK (status IN ('sent', 'viewed'))
);

CREATE INDEX idx_notification_user ON Notification (user_id, created_at DESC);

CREATE TABLE History (
  history_id     TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL
                 REFERENCES UserCredentials(user_id) ON DELETE CASCADE,

  -- ON DELETE SET NULL, not CASCADE: deleting a service must not erase the
  -- record that someone once visited it.
  service_id     TEXT REFERENCES Service(service_id) ON DELETE SET NULL,

  -- Copied in on purpose. If the service is ever deleted, the past visit can
  -- still say what it was for.
  service_name   TEXT NOT NULL,

  visit_date     TEXT NOT NULL DEFAULT (date('now', 'localtime')),
  outcome        TEXT NOT NULL
                 CHECK (outcome IN ('served', 'left', 'no-show')),
  waited_minutes INTEGER NOT NULL DEFAULT 0 CHECK (waited_minutes >= 0)
);

CREATE INDEX idx_history_user ON History (user_id, visit_date DESC);
