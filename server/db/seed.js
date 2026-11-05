// OWNER: Celestin — shared file, say something in the group chat before changing it.
//
// The demo data. Same people and services as A3, so every screen looks the
// same after the move to a database.
//
// Two things changed from the A3 seed, both because the database now enforces
// rules our arrays never did:
//
//   1. Passwords are bcrypt hashes. The plain text below exists only so we can
//      sign in during the demo; it is never stored.
//   2. Jordan and Amara each used to be in two queues at once, which breaks
//      the A1 rule of one queue per person. The database rejects that now, so
//      two extra students were added to keep the waiting counts the same.

import bcrypt from 'bcrypt';

// Cost 10 is the usual default. Hashing is meant to be slow, so the hashes
// below are computed once when this file loads rather than on every reset.
const COST = 10;

const hashOnce = (() => {
  const cache = new Map();
  return (plain) => {
    if (!cache.has(plain)) cache.set(plain, bcrypt.hashSync(plain, COST));
    return cache.get(plain);
  };
})();

// Demo sign-ins. Plain text here, hashed before it reaches the database.
export const DEMO_USERS = [
  { id: 'u1', name: 'Celestin Matala', email: 'admin@queuesmart.edu', password: 'admin123', role: 'admin' },
  { id: 'u2', name: 'Alex Rivera',     email: 'alex@queuesmart.edu',  password: 'alex1234', role: 'user'  },
  { id: 'u3', name: 'Jordan Reyes',    email: 'jordan@example.com',   password: 'jordan12', role: 'user'  },
  { id: 'u4', name: 'Amara Osei',      email: 'amara@example.com',    password: 'amara123', role: 'user'  },
  { id: 'u5', name: 'Diego Santos',    email: 'diego@example.com',    password: 'diego123', role: 'user'  },
  { id: 'u6', name: 'Priya Nair',      email: 'priya@example.com',    password: 'priya123', role: 'user'  },
  { id: 'u7', name: 'Noor Haddad',     email: 'noor@example.com',     password: 'noor1234', role: 'user'  },
  { id: 'u8', name: 'Tomas Vela',      email: 'tomas@example.com',    password: 'tomas123', role: 'user'  },
];

const SERVICES = [
  { id: 's1', name: 'Academic Advising', description: 'Course planning and degree audit questions.',
    duration: 20, priority: 'medium', open: true },
  { id: 's2', name: 'Financial Aid', description: 'Scholarship, loan, and award disbursement questions.',
    duration: 15, priority: 'high', open: true },
  { id: 's3', name: 'ID Card Services', description: 'New cards, replacements, and photo updates.',
    duration: 5, priority: 'low', open: true },
  { id: 's4', name: 'IT Help Desk', description: 'Account access, campus wifi, and software installs.',
    duration: 25, priority: 'medium', open: false },
];

// position is a real column now, so the order is written down rather than
// implied by where a row sits in an array.
const ENTRIES = [
  { id: 'q1', user: 'u3', service: 's1', position: 1, joined: '09:05' },
  { id: 'q2', user: 'u2', service: 's1', position: 2, joined: '09:12' },
  { id: 'q3', user: 'u4', service: 's1', position: 3, joined: '09:18' },
  { id: 'q4', user: 'u6', service: 's1', position: 4, joined: '09:24' },
  { id: 'q5', user: 'u5', service: 's2', position: 1, joined: '09:02' },
  { id: 'q6', user: 'u7', service: 's2', position: 2, joined: '09:20' },
  { id: 'q7', user: 'u8', service: 's3', position: 1, joined: '09:25' },
];

const NOTIFICATIONS = [
  { id: 'n1', user: 'u2', message: 'You moved up to 2nd in Academic Advising.',         at: '09:31', status: 'sent'   },
  { id: 'n2', user: 'u2', message: 'Financial Aid is running about 10 minutes behind.', at: '09:14', status: 'sent'   },
  { id: 'n3', user: 'u2', message: 'Your ID Card Services visit was completed.',        at: '08:40', status: 'viewed' },
];

const HISTORY = [
  { id: 'h1', user: 'u2', service: 's2', date: '2026-09-04', outcome: 'served',  waited: 22 },
  { id: 'h2', user: 'u2', service: 's3', date: '2026-08-28', outcome: 'served',  waited: 8  },
  { id: 'h3', user: 'u2', service: 's1', date: '2026-08-19', outcome: 'left',    waited: 35 },
  { id: 'h4', user: 'u2', service: 's4', date: '2026-08-11', outcome: 'no-show', waited: 0  },
];

/** Turns '09:05' into a full timestamp for today. */
const todayAt = (hhmm) => {
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
  return `${date} ${hhmm}:00`;
};

const serviceName = (id) => SERVICES.find((s) => s.id === id)?.name ?? 'Unknown service';

/**
 * Fills an empty database with the demo data.
 *
 * Everything happens in one transaction: either the whole seed lands or none
 * of it does, so a failure halfway cannot leave a half-built database behind.
 */
export function seed(db) {
  const insertUser = db.prepare(
    `INSERT INTO UserCredentials (user_id, email, password_hash, role)
     VALUES (?, ?, ?, ?)`);

  const insertProfile = db.prepare(
    `INSERT INTO UserProfile (user_id, full_name) VALUES (?, ?)`);

  const insertService = db.prepare(
    `INSERT INTO Service (service_id, name, description, expected_duration, priority)
     VALUES (?, ?, ?, ?, ?)`);

  const insertQueue = db.prepare(
    `INSERT INTO Queue (queue_id, service_id, status) VALUES (?, ?, ?)`);

  const insertEntry = db.prepare(
    `INSERT INTO QueueEntry (entry_id, queue_id, user_id, position, joined_at, status)
     VALUES (?, ?, ?, ?, ?, 'waiting')`);

  const insertNotification = db.prepare(
    `INSERT INTO Notification (notification_id, user_id, message, created_at, status)
     VALUES (?, ?, ?, ?, ?)`);

  const insertHistory = db.prepare(
    `INSERT INTO History (history_id, user_id, service_id, service_name, visit_date, outcome, waited_minutes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`);

  const run = db.transaction(() => {
    for (const u of DEMO_USERS) {
      insertUser.run(u.id, u.email, hashOnce(u.password), u.role);
      insertProfile.run(u.id, u.name);
    }

    for (const s of SERVICES) {
      insertService.run(s.id, s.name, s.description, s.duration, s.priority);
      // Every service gets its queue. The UNIQUE on Queue.service_id means
      // there can only ever be the one.
      insertQueue.run(`qu-${s.id}`, s.id, s.open ? 'open' : 'closed');
    }

    for (const e of ENTRIES) {
      insertEntry.run(e.id, `qu-${e.service}`, e.user, e.position, todayAt(e.joined));
    }

    for (const n of NOTIFICATIONS) {
      insertNotification.run(n.id, n.user, n.message, todayAt(n.at), n.status);
    }

    for (const h of HISTORY) {
      insertHistory.run(h.id, h.user, h.service, serviceName(h.service), h.date, h.outcome, h.waited);
    }
  });

  run();
}

export default seed;
