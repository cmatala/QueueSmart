// OWNER: Celestin - shared file, say something in the group chat before changing it.
//
// All QueueSmart data lives here. A3 needs no database, so this is plain
// JavaScript arrays held in memory. Every module reads and writes through this
// file rather than keeping its own copy, which is what lets A4 swap in a real
// database by changing only this file.
//
// The shapes are the same ones we agreed in A2's mockData.js.

export const PRIORITIES = ['low', 'medium', 'high'];

export const STATUS = {
  WAITING: 'waiting',
  ALMOST_READY: 'almost ready',
  SERVED: 'served',
  LEFT: 'left',
  NO_SHOW: 'no-show',
};

// The seed data. seed() returns a fresh copy every time it is called, so a test
// can reset the store without one test's changes leaking into the next.
function seed() {
  return {
    users: [
      { id: 'u1', name: 'Celestin Matala',   email: 'admin@queuesmart.edu', password: 'admin123', role: 'admin' },
      { id: 'u2', name: 'Alex Rivera',       email: 'alex@queuesmart.edu',  password: 'alex1234', role: 'user'  },
      { id: 'u3', name: 'Jordan Reyes',      email: 'jordan@example.com',   password: 'jordan12', role: 'user'  },
      { id: 'u4', name: 'Amara Osei',        email: 'amara@example.com',    password: 'amara123', role: 'user'  },
      { id: 'u5', name: 'Diego Santos',      email: 'diego@example.com',    password: 'diego123', role: 'user'  },
      { id: 'u6', name: 'Priya Nair',        email: 'priya@example.com',    password: 'priya123', role: 'user'  },
    ],

    services: [
      { id: 's1', name: 'Academic Advising', description: 'Course planning and degree audit questions.',
        expectedDuration: 20, priority: 'medium', isOpen: true },
      { id: 's2', name: 'Financial Aid',     description: 'Scholarship, loan, and award disbursement questions.',
        expectedDuration: 15, priority: 'high',   isOpen: true },
      { id: 's3', name: 'ID Card Services',  description: 'New cards, replacements, and photo updates.',
        expectedDuration: 5,  priority: 'low',    isOpen: true },
      { id: 's4', name: 'IT Help Desk',      description: 'Account access, campus wifi, and software installs.',
        expectedDuration: 25, priority: 'medium', isOpen: false },
    ],

    // Order in this array is the serving order for each service.
    queueEntries: [
      { id: 'q1', userId: 'u3', serviceId: 's1', joinedAt: '09:05', priority: 'medium', status: STATUS.WAITING },
      { id: 'q2', userId: 'u2', serviceId: 's1', joinedAt: '09:12', priority: 'medium', status: STATUS.WAITING },
      { id: 'q3', userId: 'u4', serviceId: 's1', joinedAt: '09:18', priority: 'low',    status: STATUS.WAITING },
      { id: 'q4', userId: 'u6', serviceId: 's1', joinedAt: '09:24', priority: 'low',    status: STATUS.WAITING },
      { id: 'q5', userId: 'u5', serviceId: 's2', joinedAt: '09:02', priority: 'high',   status: STATUS.WAITING },
      { id: 'q6', userId: 'u3', serviceId: 's2', joinedAt: '09:20', priority: 'medium', status: STATUS.WAITING },
      { id: 'q7', userId: 'u4', serviceId: 's3', joinedAt: '09:25', priority: 'low',    status: STATUS.WAITING },
    ],

    notifications: [
      { id: 'n1', userId: 'u2', message: 'You moved up to 2nd in Academic Advising.',       time: '09:31', unread: true  },
      { id: 'n2', userId: 'u2', message: 'Financial Aid is running about 10 minutes behind.', time: '09:14', unread: true  },
      { id: 'n3', userId: 'u2', message: 'Your ID Card Services visit was completed.',      time: 'Aug 28', unread: false },
    ],

    history: [
      { id: 'h1', userId: 'u2', serviceId: 's2', date: '2026-09-04', outcome: STATUS.SERVED,  waitedMinutes: 22 },
      { id: 'h2', userId: 'u2', serviceId: 's3', date: '2026-08-28', outcome: STATUS.SERVED,  waitedMinutes: 8  },
      { id: 'h3', userId: 'u2', serviceId: 's1', date: '2026-08-19', outcome: STATUS.LEFT,    waitedMinutes: 35 },
      { id: 'h4', userId: 'u2', serviceId: 's4', date: '2026-08-11', outcome: STATUS.NO_SHOW, waitedMinutes: 0  },
    ],
  };
}

// The live data. Import this and read or change its arrays.
export const store = seed();

/**
 * Puts the store back to its starting state.
 *
 * Every test file needs this in a beforeEach. Our data lives in memory, so
 * without it a test that joins a queue leaves that entry behind for the next
 * test, and you get tests that pass alone but fail when run together.
 */
export function resetStore() {
  const fresh = seed();
  for (const key of Object.keys(fresh)) {
    store[key] = fresh[key];
  }
}

// ---------- small lookups every module needs ----------

export const findUser = (userId) => store.users.find((u) => u.id === userId);

export const findUserByEmail = (email) =>
  store.users.find((u) => u.email.toLowerCase() === String(email ?? '').trim().toLowerCase());

export const findService = (serviceId) => store.services.find((s) => s.id === serviceId);

export const findEntry = (entryId) => store.queueEntries.find((e) => e.id === entryId);

/** Everyone still waiting for one service, in serving order. */
export const waitingFor = (serviceId) =>
  store.queueEntries.filter((e) => e.serviceId === serviceId && e.status === STATUS.WAITING);

/** Generates the next id for a collection, e.g. nextId('q') -> 'q8'. */
export function nextId(prefix) {
  return prefix + Date.now().toString(36) + Math.floor(Math.random() * 1000);
}
