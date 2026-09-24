// OWNER: Megan
//
// Agreed shapes (A2 plan, section 5):
//   user          id, name, email, role ('user' | 'admin')
//   service       id, name, description, expectedDuration, priority, isOpen
//   queueEntry    id, userId, serviceId, joinedAt, priority, status
//   notification  id, userId, message, time, unread
//   historyItem   id, userId, serviceId, date, outcome
//
// status is one of: 'waiting' | 'almost ready' | 'served' | 'left' | 'no-show'
// Estimated wait = people ahead x the service's expectedDuration (A1 decision).

export const users = [];
export const services = [];
export const queueEntries = [];
export const notifications = [];
export const history = [];
