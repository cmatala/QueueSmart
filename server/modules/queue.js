// OWNER: Valeriia

import { store, findService, findEntry, findUser, waitingFor, nextId, STATUS } from '../data/store.js';
import { ok, fail, isOneOf } from '../validation.js';
import { estimateWait } from './waitTime.js';
import { notifyJoined, notifyAlmostReady } from './notifications.js';
import { addHistoryEntry } from './history.js';

const DIRECTIONS = ['up', 'down'];

function nowHHMM(){
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function minutesSince(hhmm){
  const [h, m] = String(hhmm ?? '').split(':').map(Number);
  if(!Number.isFinite(h) || !Number.isFinite(m)) return 0;

  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes() - (h * 60 + m);
  return minutes > 0 ? minutes : 0;
}

function decorate(entry, index, serviceId){
  return{
    ...entry,
    position: index + 1,
    userName: findUser(entry.userId)?.name ?? 'Unknown',
    wait: estimateWait(index, serviceId),
  };
}

function findWaitingEntry(entryId){
  const entry = findEntry(entryId);
  return entry && entry.status === STATUS.WAITING ? entry : undefined;
}

export function getQueue(serviceId){
  if(!findService(serviceId)) return fail('Service not found.', 404);

  const entries = waitingFor(serviceId).map((entry, i)=>decorate(entry, i, serviceId));
  return ok(entries);
}

export function joinQueue(userId, serviceId){
  if(!findUser(userId)) return fail('User not found.', 404);

  const service = findService(serviceId);
  if(!service) return fail('Service not found.', 404);

  if(!service.isOpen) return fail('That queue is closed right now.');

  const alreadyWaiting = store.queueEntries.some(
    (e)=>e.userId === userId && e.status === STATUS.WAITING,
  );
  if(alreadyWaiting) return fail('You are already in a queue.');

  const entry = {
    id: nextId('q'),
    userId,
    serviceId,
    joinedAt: nowHHMM(),
    priority: service.priority,
    status: STATUS.WAITING,
  };

  store.queueEntries.push(entry);

  notifyJoined(userId, serviceId);

  const position = waitingFor(serviceId).length;
  return ok(decorate(entry, position - 1, serviceId));
}

export function leaveQueue(entryId){
  const entry = findWaitingEntry(entryId);
  if(!entry) return fail('Queue entry not found.', 404);

  const index = store.queueEntries.indexOf(entry);
  store.queueEntries.splice(index, 1);

  addHistoryEntry({
    userId: entry.userId,
    serviceId: entry.serviceId,
    outcome: STATUS.LEFT,
    waitedMinutes: minutesSince(entry.joinedAt),
  });

  return ok({ removed: true });
}

export function serveNext(serviceId){
  if(!findService(serviceId)) return fail('Service not found.', 404);

  const waiting = waitingFor(serviceId);
  if(waiting.length === 0) return fail('There is nobody waiting for this service.');

  const served = waiting[0];
  served.status = STATUS.SERVED;

  addHistoryEntry({
    userId: served.userId,
    serviceId,
    outcome: STATUS.SERVED,
    waitedMinutes: minutesSince(served.joinedAt),
  });

  const next = waitingFor(serviceId)[0];
  if(next) notifyAlmostReady(next.userId, serviceId);

  return ok({
    ...served,
    userName: findUser(served.userId)?.name ?? 'Unknown',
  });
}

export function moveEntry(entryId, direction){
  const badDirection = isOneOf(direction, DIRECTIONS, 'Direction');
  if(badDirection) return fail(badDirection);

  const entry = findWaitingEntry(entryId);
  if(!entry) return fail('Queue entry not found.', 404);

  const waiting = waitingFor(entry.serviceId);
  const here = waiting.indexOf(entry);
  const there = direction === 'up' ? here - 1 : here + 1;

  if(there < 0) return fail('That entry is already first in the queue.');
  if(there >= waiting.length) return fail('That entry is already last in the queue.');

  const a = store.queueEntries.indexOf(waiting[here]);
  const b = store.queueEntries.indexOf(waiting[there]);
  [store.queueEntries[a], store.queueEntries[b]] = [store.queueEntries[b], store.queueEntries[a]];

  return getQueue(entry.serviceId);
}

export function getUserStatus(userId){
  const entry = store.queueEntries.find(
    (e)=>e.userId === userId && e.status === STATUS.WAITING,
  );
  if(!entry) return ok(null);

  const waiting = waitingFor(entry.serviceId);
  const index = waiting.indexOf(entry);
  const service = findService(entry.serviceId);

  return ok({
    service: service?.name ?? 'Unknown service',
    position: index + 1,
    wait: estimateWait(index, entry.serviceId),
    status: index === 0 ? STATUS.ALMOST_READY : STATUS.WAITING,
    serviceId: entry.serviceId,
    entryId: entry.id,
  });
}