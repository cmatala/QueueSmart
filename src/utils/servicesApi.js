// OWNER: Megan
// The fetch calls the User Dashboard and Join Queue screens need.
// TODO: once Celestin's src/api/client.js has these, move them there and
// import from it instead.
//
// Every function resolves with the response data or throws an Error whose
// message is safe to show the user.

const SERVER_DOWN = 'Could not reach the server. Please check it is running and try again.';

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error(SERVER_DOWN);
  }

  let body;
  try {
    body = await res.json();
  } catch {
    body = undefined; // not JSON: the dev proxy answers this way when the server is off
  }

  if (!res.ok) {
    throw new Error(body?.error ?? (res.status >= 500 ? SERVER_DOWN : 'Something went wrong. Please try again.'));
  }
  if (body === undefined) throw new Error(SERVER_DOWN);
  return body;
}

export const getServices = () => request('/services');

export const getUserStatus = (userId) => request(`/users/${userId}/status`);

export const getNotifications = (userId) => request(`/users/${userId}/notifications`);

export const joinQueue = (serviceId, userId) =>
  request(`/queue/${serviceId}/join`, { method: 'POST', body: JSON.stringify({ userId }) });

// Leaving needs the entry id, so find this user's entry in the queue first.
export async function leaveQueue(serviceId, userId) {
  const queue = await request(`/queue/${serviceId}`);
  const mine = queue.find((entry) => entry.userId === userId);
  if (!mine) throw new Error('You are not in this queue.');
  return request(`/queue/entries/${mine.id}`, { method: 'DELETE' });
}