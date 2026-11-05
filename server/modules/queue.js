// OWNER: Valeriia

import {
  findService, findEntry, findUser, waitingFor, findWaitingEntryForUser,
  insertEntry, removeEntry, setEntryStatus, swapPositions, transaction,
  nextId, STATUS,
} from '../data/store.js';
import { ok, fail, isOneOf } from '../validation.js';
import { estimateWait } from './waitTime.js';
import { notifyJoined, notifyAlmostReady } from './notifications.js';
import { addHistoryEntry } from './history.js';

const DIRECTIONS = ['up', 'down'];

function minutesSince(timestamp){
  const then = new Date(String(timestamp ?? '').replace(' ', 'T'));
  if(Number.isNaN(then.getTime())) return 0;

  const minutes = Math.round((Date.now() - then.getTime()) / 60000);
  return minutes > 0 ? minutes : 0;
}

function forApi(entry){
  const { queueId, joinedAtFull, ...rest } = entry;
  return{
    ...rest,
    userName: findUser(entry.userId)?.name ?? 'Unknown',
    wait: estimateWait(entry.position - 1, entry.serviceId),
  };
}

function findWaitingEntry(entryId){
  const entry = findEntry(entryId);
  return entry && entry.status === STATUS.WAITING ? entry : undefined;
}

export function getQueue(serviceId){
  if(!findService(serviceId)) return fail('Service not found.', 404);

  return ok(waitingFor(serviceId).map(forApi));
}

export function joinQueue(userId, serviceId){
  if(!findUser(userId)) return fail('User not found.', 404);

  const service = findService(serviceId);
  if(!service) return fail('Service not found.', 404);

  if(!service.isOpen) return fail('That queue is closed right now.');

  if(findWaitingEntryForUser(userId)) return fail('You are already in a queue.');

  let entry;
  try{
    entry = insertEntry({ id: nextId('q'), serviceId, userId });
  }
  catch(error){
    if(error.code === 'SQLITE_CONSTRAINT_UNIQUE') return fail('You are already in a queue.');
    return fail('Could not join that queue.', 500);
  }

  notifyJoined(userId, serviceId);

  return ok(forApi(entry));
}

export function leaveQueue(entryId){
  const entry = findWaitingEntry(entryId);
  if(!entry) return fail('Queue entry not found.', 404);

  transaction(()=>{
    removeEntry(entry.id);             
    addHistoryEntry({
      userId: entry.userId,
      serviceId: entry.serviceId,
      outcome: STATUS.LEFT,
      waitedMinutes: minutesSince(entry.joinedAtFull),
    });
  })();

  return ok({ removed: true });
}

export function serveNext(serviceId){
  if(!findService(serviceId)) return fail('Service not found.', 404);

  const waiting = waitingFor(serviceId);
  if(waiting.length === 0) return fail('There is nobody waiting for this service.');

  const first = waiting[0];

  transaction(()=>{
    setEntryStatus(first.id, STATUS.SERVED);
    addHistoryEntry({
      userId: first.userId,
      serviceId,
      outcome: STATUS.SERVED,
      waitedMinutes: minutesSince(first.joinedAtFull),
    });
  })();

  const next = waitingFor(serviceId)[0];
  if(next) notifyAlmostReady(next.userId, serviceId);

  const { queueId, joinedAtFull, position, ...served } = findEntry(first.id);
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
  const here = waiting.findIndex((e)=>e.id === entry.id);
  const there = direction === 'up' ? here - 1 : here + 1;

  if(there < 0) return fail('That entry is already first in the queue.');
  if(there >= waiting.length) return fail('That entry is already last in the queue.');

  try{
    swapPositions(waiting[here].id, waiting[there].id);
  }
  catch{
    return fail('Could not move that entry. The queue was not changed.', 500);
  }

  return getQueue(entry.serviceId);
}

export function getUserStatus(userId){
  const entry = findWaitingEntryForUser(userId);
  if(!entry) return ok(null);

  const service = findService(entry.serviceId);

  return ok({
    service: service?.name ?? 'Unknown service',
    position: entry.position,
    wait: estimateWait(entry.position - 1, entry.serviceId),
    status: entry.position === 1 ? STATUS.ALMOST_READY : STATUS.WAITING,
    serviceId: entry.serviceId,
    entryId: entry.id,
  });
}