// OWNER: Celestin — shared file, say something in the group chat before changing it.
//
// Every SQL statement in QueueSmart lives here. No other file writes a query.
//
// This is the same role store.js had in A3: the one place that owns the data.
// What changed is what is underneath. The arrays are gone and each function
// below runs a prepared statement instead.
//
// The names and the shapes are deliberately the A3 ones. findService() still
// returns an object with isOpen on it, even though open/closed now lives in a
// separate Queue table, so the modules and the API did not have to be
// redesigned around the schema.

import { db } from '../db/connection.js';
import { rebuild } from '../db/migrate.js';

// Every statement below is prepared once, when this file loads, which means
// the tables have to exist by then. On a machine that has never run
// db:reset -- or in a fresh test worker, which gets its own empty file --
// they do not, so build them now.
const built = db.prepare(
  `SELECT COUNT(*) AS n FROM sqlite_master
   WHERE type = 'table' AND name = 'UserCredentials'`).get().n;

if (built === 0) rebuild();

export const PRIORITIES = ['low', 'medium', 'high'];
export const ROLES = ['user', 'admin'];

export const STATUS = {
  WAITING: 'waiting',
  ALMOST_READY: 'almost ready',
  SERVED: 'served',
  LEFT: 'left',
  NO_SHOW: 'no-show',
};

export const OUTCOMES = [STATUS.SERVED, STATUS.LEFT, STATUS.NO_SHOW];

/** Generates the next id for a row, e.g. nextId('q') -> 'qmg4k1x882'. */
export function nextId(prefix) {
  return prefix + Date.now().toString(36) + Math.floor(Math.random() * 1000);
}

/**
 * Puts the database back to its seeded state.
 *
 * Every test file calls this in a beforeEach, exactly as in A3. The arrays it
 * used to reset are now tables, but the job and the name are unchanged.
 */
export function resetStore() {
  rebuild();
}

/**
 * Runs several statements as one unit: either all of them land or none do.
 *
 *   transaction(() => { insertEntry(...); insertNotification(...); })()
 *
 * Use it anywhere two writes have to agree with each other, which in A4 means
 * registering a user and reordering a queue.
 */
export const transaction = (fn) => db.transaction(fn);

// ---------------------------------------------------------------- users

const USER_COLUMNS = `
  c.user_id AS id, p.full_name AS name, c.email, c.role,
  p.phone, p.notify_by AS notifyBy`;

const userById = db.prepare(`
  SELECT ${USER_COLUMNS} FROM UserCredentials c
  JOIN UserProfile p ON p.user_id = c.user_id
  WHERE c.user_id = ?`);

const userByEmail = db.prepare(`
  SELECT ${USER_COLUMNS}, c.password_hash AS passwordHash
  FROM UserCredentials c
  JOIN UserProfile p ON p.user_id = c.user_id
  WHERE c.email = ? COLLATE NOCASE`);

export const findUser = (userId) => userById.get(userId) ?? undefined;

/** Only this lookup returns the password hash; nothing else should need it. */
export const findUserByEmail = (email) =>
  userByEmail.get(String(email ?? '').trim()) ?? undefined;

const addCredentials = db.prepare(`
  INSERT INTO UserCredentials (user_id, email, password_hash, role)
  VALUES (@id, @email, @passwordHash, @role)`);

const addProfile = db.prepare(`
  INSERT INTO UserProfile (user_id, full_name, phone) VALUES (@id, @name, @phone)`);

/**
 * Creates a user. Both tables are written together, so a failure on the
 * second one rolls the first one back rather than leaving credentials with
 * no profile attached.
 */
export const insertUser = transaction(({ id, name, email, passwordHash, role = 'user', phone = null }) => {
  addCredentials.run({ id, email, passwordHash, role });
  addProfile.run({ id, name, phone });
  return findUser(id);
});

// ---------------------------------------------------------------- services

// isOpen comes from the Queue row, so callers keep seeing the A3 shape.
const SERVICE_COLUMNS = `
  s.service_id AS id, s.name, s.description,
  s.expected_duration AS expectedDuration, s.priority,
  q.queue_id AS queueId,
  CASE q.status WHEN 'open' THEN 1 ELSE 0 END AS isOpenInt`;

const withIsOpen = (row) => {
  if (!row) return undefined;
  const { isOpenInt, ...rest } = row;
  return { ...rest, isOpen: isOpenInt === 1 };
};

const serviceById = db.prepare(`
  SELECT ${SERVICE_COLUMNS} FROM Service s
  JOIN Queue q ON q.service_id = s.service_id
  WHERE s.service_id = ?`);

const servicesAll = db.prepare(`
  SELECT ${SERVICE_COLUMNS},
    (SELECT COUNT(*) FROM QueueEntry e
      WHERE e.queue_id = q.queue_id AND e.status = 'waiting') AS waiting
  FROM Service s
  JOIN Queue q ON q.service_id = s.service_id
  ORDER BY s.name`);

export const findService = (serviceId) => withIsOpen(serviceById.get(serviceId));

/** Every service with its live waiting count, counted by the database. */
export const allServices = () => servicesAll.all().map(withIsOpen);

const addService = db.prepare(`
  INSERT INTO Service (service_id, name, description, expected_duration, priority)
  VALUES (@id, @name, @description, @expectedDuration, @priority)`);

const addQueue = db.prepare(`
  INSERT INTO Queue (queue_id, service_id, status) VALUES (@queueId, @id, 'open')`);

/** A new service always gets its queue, open and empty. */
export const insertService = transaction((service) => {
  addService.run(service);
  addQueue.run({ queueId: `qu-${service.id}`, id: service.id });
  return findService(service.id);
});

const editService = db.prepare(`
  UPDATE Service SET name = @name, description = @description,
    expected_duration = @expectedDuration, priority = @priority
  WHERE service_id = @id`);

export function updateServiceRow(service) {
  editService.run(service);
  return findService(service.id);
}

const setQueue = db.prepare(`UPDATE Queue SET status = ? WHERE service_id = ?`);

export function setServiceOpenRow(serviceId, isOpen) {
  setQueue.run(isOpen ? 'open' : 'closed', serviceId);
  return findService(serviceId);
}

// ---------------------------------------------------------------- queue

// serviceId is joined in so an entry looks like it did in A3, where entries
// pointed straight at a service.
const ENTRY_COLUMNS = `
  e.entry_id AS id, e.queue_id AS queueId, e.user_id AS userId,
  q.service_id AS serviceId, e.position, e.status,
  substr(e.joined_at, 12, 5) AS joinedAt, e.joined_at AS joinedAtFull,
  s.priority`;

const entryById = db.prepare(`
  SELECT ${ENTRY_COLUMNS} FROM QueueEntry e
  JOIN Queue q ON q.queue_id = e.queue_id
  JOIN Service s ON s.service_id = q.service_id
  WHERE e.entry_id = ?`);

const entriesWaiting = db.prepare(`
  SELECT ${ENTRY_COLUMNS} FROM QueueEntry e
  JOIN Queue q ON q.queue_id = e.queue_id
  JOIN Service s ON s.service_id = q.service_id
  WHERE q.service_id = ? AND e.status = 'waiting'
  ORDER BY e.position`);

const liveEntryForUser = db.prepare(`
  SELECT ${ENTRY_COLUMNS} FROM QueueEntry e
  JOIN Queue q ON q.queue_id = e.queue_id
  JOIN Service s ON s.service_id = q.service_id
  WHERE e.user_id = ? AND e.status = 'waiting'`);

export const findEntry = (entryId) => entryById.get(entryId) ?? undefined;

/** Everyone still waiting for one service, in serving order. */
export const waitingFor = (serviceId) => entriesWaiting.all(serviceId);

/** The one queue a user is currently in, or undefined. */
export const findWaitingEntryForUser = (userId) => liveEntryForUser.get(userId) ?? undefined;

const nextPosition = db.prepare(`
  SELECT COALESCE(MAX(position), 0) + 1 AS next FROM QueueEntry
  WHERE queue_id = ? AND status = 'waiting'`);

const addEntry = db.prepare(`
  INSERT INTO QueueEntry (entry_id, queue_id, user_id, position)
  VALUES (@id, @queueId, @userId, @position)`);

/** Appends a user to the back of a service's queue. */
export const insertEntry = transaction(({ id, serviceId, userId }) => {
  const queueId = `qu-${serviceId}`;
  const position = nextPosition.get(queueId).next;
  addEntry.run({ id, queueId, userId, position });
  return findEntry(id);
});

const dropEntry = db.prepare(`DELETE FROM QueueEntry WHERE entry_id = ?`);
const markEntry = db.prepare(`UPDATE QueueEntry SET status = ? WHERE entry_id = ?`);

const closeGaps = db.prepare(`
  UPDATE QueueEntry SET position = (
    SELECT COUNT(*) FROM QueueEntry earlier
    WHERE earlier.queue_id = QueueEntry.queue_id
      AND earlier.status = 'waiting'
      AND earlier.position <= QueueEntry.position)
  WHERE queue_id = ? AND status = 'waiting'`);

/**
 * Renumbers a queue so the waiting entries read 1, 2, 3 with no gaps.
 *
 * Needed after anything leaves the queue, because removing position 2 would
 * otherwise leave 1, 3, 4 behind.
 */
export const resequence = (queueId) => closeGaps.run(queueId);

/** Removes an entry and closes the gap it left. */
export const removeEntry = transaction((entryId) => {
  const entry = findEntry(entryId);
  if (!entry) return undefined;
  dropEntry.run(entryId);
  resequence(entry.queueId);
  return entry;
});

/** Marks an entry served, left or no-show, and closes the gap. */
export const setEntryStatus = transaction((entryId, status) => {
  const entry = findEntry(entryId);
  if (!entry) return undefined;
  markEntry.run(status, entryId);
  resequence(entry.queueId);
  return findEntry(entryId);
});

const setPosition = db.prepare(`UPDATE QueueEntry SET position = ? WHERE entry_id = ?`);

/**
 * Swaps two entries' positions.
 *
 * Wrapped in a transaction because it is two UPDATEs: if the second one fails,
 * the first must be undone or the queue ends up with two entries claiming the
 * same place. This is the one operation in A4 where a half-finished write
 * would corrupt real data.
 */
export const swapPositions = transaction((entryIdA, entryIdB) => {
  const a = findEntry(entryIdA);
  const b = findEntry(entryIdB);
  if (!a || !b) return false;
  setPosition.run(b.position, a.id);
  setPosition.run(a.position, b.id);
  return true;
});

// ---------------------------------------------------------- notifications

const addNotification = db.prepare(`
  INSERT INTO Notification (notification_id, user_id, message)
  VALUES (@id, @userId, @message)`);

const notificationById = db.prepare(`
  SELECT notification_id AS id, user_id AS userId, message,
         substr(created_at, 12, 5) AS time, status
  FROM Notification WHERE notification_id = ?`);

const notificationsByUser = db.prepare(`
  SELECT notification_id AS id, user_id AS userId, message,
         substr(created_at, 12, 5) AS time, status
  FROM Notification WHERE user_id = ?
  ORDER BY created_at DESC, rowid DESC`);

const viewNotification = db.prepare(`
  UPDATE Notification SET status = 'viewed' WHERE notification_id = ?`);

const viewAllForUser = db.prepare(`
  UPDATE Notification SET status = 'viewed' WHERE user_id = ? AND status = 'sent'`);

export function insertNotification({ id, userId, message }) {
  addNotification.run({ id, userId, message });
  return notificationById.get(id);
}

export const notificationsFor = (userId) => notificationsByUser.all(userId);

export const findNotification = (id) => notificationById.get(id) ?? undefined;

export function markNotificationViewed(id) {
  const changed = viewNotification.run(id).changes;
  return changed > 0 ? notificationById.get(id) : undefined;
}

export const markAllNotificationsViewed = (userId) => viewAllForUser.run(userId).changes;

// ---------------------------------------------------------------- history

const addHistory = db.prepare(`
  INSERT INTO History (history_id, user_id, service_id, service_name, outcome, waited_minutes)
  VALUES (@id, @userId, @serviceId, @serviceName, @outcome, @waitedMinutes)`);

const historyById = db.prepare(`
  SELECT history_id AS id, user_id AS userId, service_id AS serviceId,
         service_name AS serviceName, visit_date AS date, outcome,
         waited_minutes AS waitedMinutes
  FROM History WHERE history_id = ?`);

const historyByUser = db.prepare(`
  SELECT history_id AS id, user_id AS userId, service_id AS serviceId,
         service_name AS serviceName, visit_date AS date, outcome,
         waited_minutes AS waitedMinutes
  FROM History WHERE user_id = ?
  ORDER BY visit_date DESC, rowid DESC`);

export function insertHistory(row) {
  addHistory.run(row);
  return historyById.get(row.id);
}

export const historyFor = (userId) => historyByUser.all(userId);

export const findHistory = (id) => historyById.get(id) ?? undefined;

export { db };
