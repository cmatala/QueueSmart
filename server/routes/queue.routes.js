// OWNER: Valeriia
//
// The HTTP layer for the queue. No rules in this file.

import { Router } from 'express';
import { getQueue, joinQueue, leaveQueue, serveNext, moveEntry } from '../modules/queue.js';

const router = Router();

const send = (res, result, successStatus = 200) =>
  result.ok
    ? res.status(successStatus).json(result.data)
    : res.status(result.status).json({ error: result.error });

router.get('/:serviceId', (req, res) => send(res, getQueue(req.params.serviceId)));

router.post('/:serviceId/join', (req, res) =>
  send(res, joinQueue(req.body?.userId, req.params.serviceId), 201));

router.delete('/entries/:id', (req, res) => send(res, leaveQueue(req.params.id)));

router.post('/:serviceId/serve', (req, res) => send(res, serveNext(req.params.serviceId)));

router.patch('/entries/:id/move', (req, res) =>
  send(res, moveEntry(req.params.id, req.body?.direction)));

export default router;
