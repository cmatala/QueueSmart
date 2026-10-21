// OWNER: Megan
// Shared by UserDashboard and JoinQueue: loads the services (each with the
// server's waiting count) and this user's place in line, and handles join and
// leave. All numbers come from the server; nothing is calculated here.

import { useCallback, useEffect, useState } from 'react';
import * as api from './servicesApi';

export default function useQueueData(userId) {
  const [services, setServices] = useState([]);
  const [status, setStatus] = useState(null); // { service, position, wait, status } or null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null); // { text, isError }

  const reload = useCallback(async () => {
    try {
      const [list, mine] = await Promise.all([api.getServices(), api.getUserStatus(userId)]);
      setServices(list);
      setStatus(mine);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const join = async (service) => {
    try {
      await api.joinQueue(service.id, userId);
      setNotice({ text: `You joined ${service.name}.`, isError: false });
    } catch (err) {
      setNotice({ text: err.message, isError: true });
    }
    await reload();
  };

  const leave = async (service) => {
    try {
      await api.leaveQueue(service.id, userId);
      setNotice({ text: `You left ${service.name}.`, isError: false });
    } catch (err) {
      setNotice({ text: err.message, isError: true });
    }
    await reload();
  };

  // The user's position in this service's queue, or 0 if they are not in it.
  const positionIn = (service) =>
    status && status.service === service.name ? status.position : 0;

  return { services, status, loading, error, notice, reload, join, leave, positionIn };
}