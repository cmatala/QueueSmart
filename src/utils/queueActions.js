// OWNER: Megan
// Small helpers for joining/leaving a queue, shared by UserDashboard and JoinQueue.
// They return a NEW entries array, so callers just do setEntries(...).

import { CURRENT_USER_ID, STATUS } from '../data/mockData';

// The signed-in user's waiting entry for a service, or undefined.
export const findMyEntry = (entries, serviceId) =>
  entries.find(
    (e) =>
      e.userId === CURRENT_USER_ID &&
      e.serviceId === serviceId &&
      e.status !== STATUS.SERVED,
  );

// 1-based position in the service's queue, or 0 if the user is not in it.
export const positionIn = (queue) =>
  queue.findIndex((e) => e.userId === CURRENT_USER_ID) + 1;

export const joinQueue = (entries, service) => {
  if (!service.isOpen || findMyEntry(entries, service.id)) return entries;
  const now = new Date();
  const joinedAt = now.toTimeString().slice(0, 5); // "09:12"
  return [
    ...entries,
    {
      id: `e${Date.now()}`,
      userId: CURRENT_USER_ID,
      serviceId: service.id,
      joinedAt,
      priority: service.priority,
      status: STATUS.WAITING,
    },
  ];
};

export const leaveQueue = (entries, serviceId) =>
  entries.filter(
    (e) => !(e.userId === CURRENT_USER_ID && e.serviceId === serviceId && e.status !== STATUS.SERVED),
  );