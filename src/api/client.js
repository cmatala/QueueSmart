// OWNER: Celestin - shared file, say something in the group chat before changing it.
//
// Every network call the front end makes lives here. Screens import these
// functions and never write fetch themselves, so changing a URL means editing
// one file instead of nine.
//
// Each function either returns the parsed JSON, or throws an Error carrying
// the server's message. In a screen:
//
//   getServices()
//     .then(setServices)
//     .catch((e) => setError(e.message));

const BASE = '/api';

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    // fetch only rejects when the request never reached the server.
    throw new Error('Could not reach the server. Is it running?');
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? 'Something went wrong.');
  return body;
}

const post = (path, data) => request(path, { method: 'POST', body: JSON.stringify(data ?? {}) });
const put = (path, data) => request(path, { method: 'PUT', body: JSON.stringify(data ?? {}) });
const patch = (path, data) => request(path, { method: 'PATCH', body: JSON.stringify(data ?? {}) });
const del = (path) => request(path, { method: 'DELETE' });

// ---------- Celeste: authentication ----------

export const register = ({ name, email, password }) =>
  post('/auth/register', { name, email, password });

export const login = ({ email, password }) =>
  post('/auth/login', { email, password });

// ---------- Megan: services ----------

export const getServices = () => request('/services');

export const createService = (fields, userId) => post('/services', { ...fields, userId });

export const updateService = (id, fields, userId) => put(`/services/${id}`, { ...fields, userId });

export const setServiceOpen = (id, isOpen, userId) =>
  patch(`/services/${id}/open`, { isOpen, userId });

// ---------- Valeriia: queue and wait time ----------

export const getQueue = (serviceId) => request(`/queue/${serviceId}`);

export const joinQueue = (serviceId, userId) => post(`/queue/${serviceId}/join`, { userId });

export const leaveQueue = (entryId) => del(`/queue/entries/${entryId}`);

export const serveNext = (serviceId) => post(`/queue/${serviceId}/serve`);

export const moveEntry = (entryId, direction) =>
  patch(`/queue/entries/${entryId}/move`, { direction });

export const getUserStatus = (userId) => request(`/users/${userId}/status`);

// ---------- Celestin: notifications and history ----------

export const getNotifications = (userId) => request(`/users/${userId}/notifications`);

export const getHistory = (userId) => request(`/users/${userId}/history`);
