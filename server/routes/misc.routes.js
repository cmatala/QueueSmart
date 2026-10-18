// OWNER: Celestin
//
// Per-user endpoints: status, notifications, history. Mounted at /api/users.

import { Router } from 'express';
import { getUserStatus } from '../modules/queue.js';
import { getNotifications } from '../modules/notifications.js';
import { getHistory } from '../modules/history.js';

const router = Router();

const send = (res, result, successStatus = 200) =>
  result.ok
    ? res.status(successStatus).json(result.data)
    : res.status(result.status).json({ error: result.error });

router.get('/:id/status', (req, res) => send(res, getUserStatus(req.params.id)));

router.get('/:id/notifications', (req, res) => send(res, getNotifications(req.params.id)));

router.get('/:id/history', (req, res) => send(res, getHistory(req.params.id)));

export default router;
