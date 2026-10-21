// OWNER: Valeriia

import { store, findService, findEntry, findUser, waitingFor, nextId, STATUS } from '../data/store.js';
import { ok, fail } from '../validation.js';
import { estimateWait } from './waitTime.js';
import { notifyJoined, notifyAlmostReady } from './notifications.js';
import { addHistoryEntry } from './history.js';


export function getQueue(serviceId){
  const service = findService(serviceId);

  if(!service){
    return fail('Service not found.', 404);
  }

  const entries = waitingFor(serviceId);

  const queue = entries.map((entry, index) => {
    const user = findUser(entry.userId);

    return{
      ...entry,
      position: index + 1,
      userName: user ? user.name : 'Unknown user',
      wait: estimateWait(index, serviceId),
    };
  });

  return ok(queue);
}

export function joinQueue(userId, serviceId){
  const service = findService(serviceId);

  if(!service){
    return fail('Service not found.', 404);
  }

  if(!findUser(userId)){
    return fail('User not found.', 404);
  }

  if(!service.isOpen){
    return fail('This service is closed.', 400);
  }

  const alreadyInQueue = store.queueEntries.some(
    (entry) =>
      entry.userId === userId &&
      entry.status === STATUS.WAITING
  );

  if(alreadyInQueue){
    return fail('User is already in a queue.', 400);
  }

  const entry = {
    id: nextId('q'),
    userId,
    serviceId,
    joinedAt: new Date().toISOString(),
    priority: 'medium',
    status: STATUS.WAITING,
  };

  store.queueEntries.push(entry);
  notifyJoined(userId, serviceId);

  return ok(entry);
}

export function leaveQueue(entryId){
  const entry = findEntry(entryId);

  if(!entry || entry.status !== STATUS.WAITING){
    return fail('Queue entry not found.', 404);
  }

  store.queueEntries = store.queueEntries.filter(
    (item) => item.id !== entryId
  );

  return ok({ removed: true });
}

export function serveNext(serviceId){
  const service = findService(serviceId);

  if(!service){
    return fail('Service not found.', 404);
  }

  const entries = waitingFor(serviceId);
  const entry = entries[0];

  if(!entry){
    return fail('Queue is empty.', 400);
  }

  const position = entries.length;
  const waitedMinutes = estimateWait(position - 1, serviceId);

  entry.status = STATUS.SERVED;

  addHistoryEntry({
    userId: entry.userId,
    serviceId,
    outcome: STATUS.SERVED,
    waitedMinutes,
  });

  const nextEntry = waitingFor(serviceId)[0];

  if(nextEntry){
    notifyAlmostReady(nextEntry.userId, serviceId);
  }

  return ok(entry);
}

export function moveEntry(entryId, direction){
  if(direction !== 'up' && direction !== 'down'){
    return fail('Direction must be up or down.', 400);
  }

  const entry = findEntry(entryId);

  if(!entry || entry.status !== STATUS.WAITING){
    return fail('Queue entry not found.', 404);
  }

  const entries = waitingFor(entry.serviceId);
  const index = entries.findIndex((item) => item.id === entryId);

  if(direction === 'up' && index === 0){
    return fail('Entry is already first.', 400);
  }

  if(direction === 'down' && index === entries.length - 1){
    return fail('Entry is already last.', 400);
  }

  const otherEntry = direction === 'up'
    ? entries[index - 1]
    : entries[index + 1];

  const currentIndex = store.queueEntries.findIndex(
    (item) => item.id === entryId
  );
  const otherIndex = store.queueEntries.findIndex(
    (item) => item.id === otherEntry.id
  );

  store.queueEntries[currentIndex] = otherEntry;
  store.queueEntries[otherIndex] = entry;

  const reorderedQueue = waitingFor(entry.serviceId).map((item, index) => {
    const user = findUser(item.userId);

    return {
      ...item,
      position: index + 1,
      userName: user ? user.name : 'Unknown user',
      wait: estimateWait(index, entry.serviceId),
    };
  });

  return ok(reorderedQueue);
}

export function getUserStatus(userId){
  const entry = store.queueEntries.find(
    (item) =>
      item.userId === userId &&
      item.status === STATUS.WAITING
  );

  if(!entry){
    return ok(null);
  }

  const entries = waitingFor(entry.serviceId);
  const index = entries.findIndex((item) => item.id === entry.id);
  const position = index + 1;
  const service = findService(entry.serviceId);

  return ok({
    service: service ? service.name : null,
    position,
    wait: estimateWait(index, entry.serviceId),
    status: position === 1
      ? STATUS.ALMOST_READY
      : STATUS.WAITING,
  });
}
