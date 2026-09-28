// OWNER: Megan
//
// Agreed shapes (A2 plan, section 5). No backend in A2, so every screen
// reads from here.

export const PRIORITIES = ['low', 'medium', 'high'];

export const STATUS = {
  WAITING: 'waiting',
  ALMOST_READY: 'almost ready',
  SERVED: 'served',
  LEFT: 'left',
  NO_SHOW: 'no-show',
};

// The signed-in user for demo purposes. Celeste's login will set this properly.
export const CURRENT_USER_ID = 'u2';

export const users = [
  { id: 'u1', name: 'Celestin Matala',   email: 'admin@queuesmart.edu', role: 'admin' },
  { id: 'u2', name: 'Alex Rivera',       email: 'alex@queuesmart.edu',  role: 'user'  },
  { id: 'u3', name: 'Jordan Reyes',      email: 'jordan@example.com',   role: 'user'  },
  { id: 'u4', name: 'Amara Osei',        email: 'amara@example.com',    role: 'user'  },
  { id: 'u5', name: 'Diego Santos',      email: 'diego@example.com',    role: 'user'  },
  { id: 'u6', name: 'Priya Nair',        email: 'priya@example.com',    role: 'user'  },
];

export const services = [
  {
    id: 's1',
    name: 'Academic Advising',
    description: 'Course planning and degree audit questions.',
    expectedDuration: 20,
    priority: 'medium',
    isOpen: true,
  },
  {
    id: 's2',
    name: 'Financial Aid',
    description: 'Scholarship, loan, and award disbursement questions.',
    expectedDuration: 15,
    priority: 'high',
    isOpen: true,
  },
  {
    id: 's3',
    name: 'ID Card Services',
    description: 'New cards, replacements, and photo updates.',
    expectedDuration: 5,
    priority: 'low',
    isOpen: true,
  },
  {
    id: 's4',
    name: 'IT Help Desk',
    description: 'Account access, campus wifi, and software installs.',
    expectedDuration: 25,
    priority: 'medium',
    isOpen: false,
  },
];

// Order in this array is the serving order for each service.
export const queueEntries = [
  { id: 'q1', userId: 'u3', serviceId: 's1', joinedAt: '09:05', priority: 'medium', status: STATUS.WAITING },
  { id: 'q2', userId: 'u2', serviceId: 's1', joinedAt: '09:12', priority: 'medium', status: STATUS.WAITING },
  { id: 'q3', userId: 'u4', serviceId: 's1', joinedAt: '09:18', priority: 'low',    status: STATUS.WAITING },
  { id: 'q4', userId: 'u6', serviceId: 's1', joinedAt: '09:24', priority: 'low',    status: STATUS.WAITING },
  { id: 'q5', userId: 'u5', serviceId: 's2', joinedAt: '09:02', priority: 'high',   status: STATUS.WAITING },
  { id: 'q6', userId: 'u3', serviceId: 's2', joinedAt: '09:20', priority: 'medium', status: STATUS.WAITING },
  { id: 'q7', userId: 'u4', serviceId: 's3', joinedAt: '09:25', priority: 'low',    status: STATUS.WAITING },
];

export const notifications = [
  { id: 'n1', userId: 'u2', message: 'You moved up to 2nd in Academic Advising.', time: '09:31', unread: true },
  { id: 'n2', userId: 'u2', message: 'Financial Aid is running about 10 minutes behind.', time: '09:14', unread: true },
  { id: 'n3', userId: 'u2', message: 'Your ID Card Services visit was completed.', time: 'Aug 28', unread: false },
];

// Completed visits, for the History screen. Includes all three outcomes.
export const history = [
  { id: 'h1', userId: 'u2', serviceId: 's2', date: '2026-09-04', outcome: STATUS.SERVED,  waitedMinutes: 22 },
  { id: 'h2', userId: 'u2', serviceId: 's3', date: '2026-08-28', outcome: STATUS.SERVED,  waitedMinutes: 8  },
  { id: 'h3', userId: 'u2', serviceId: 's1', date: '2026-08-19', outcome: STATUS.LEFT,    waitedMinutes: 35 },
  { id: 'h4', userId: 'u2', serviceId: 's4', date: '2026-08-11', outcome: STATUS.NO_SHOW, waitedMinutes: 0  },
];

// ---------- helpers every screen can use ----------

export const getUser = (userId) => users.find((u) => u.id === userId);

export const getService = (serviceId) => services.find((s) => s.id === serviceId);

// Everyone still waiting for a service, in serving order.
export const getQueue = (entries, serviceId) =>
  entries.filter((e) => e.serviceId === serviceId && e.status === STATUS.WAITING);

// A1 decision: people ahead x the service's expected duration.
export const estimateWait = (peopleAhead, serviceId) => {
  const service = getService(serviceId);
  if (!service) return 0;
  return peopleAhead * service.expectedDuration;
};

export const formatWait = (minutes) => {
  if (minutes <= 0) return 'Next up';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
};

export const formatDate = (iso) => {
  // Split the string so the date is built in local time, not UTC.
  // new Date('2026-09-04') is UTC midnight, which reads as Sep 3 in the US.
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};