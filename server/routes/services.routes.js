// OWNER: Megan
//
// The HTTP layer for services. No rules in this file.
//
// There is no real session in A3, so the caller passes userId in the body for
// administrator actions. The module checks whether that user is an admin.

import { Router } from 'express';
import { listServices, createService, updateService, setServiceOpen } from '../modules/services.js';

const router = Router();

const send = (res, result, successStatus = 200) =>
  result.ok
    ? res.status(successStatus).json(result.data)
    : res.status(result.status).json({ error: result.error });

router.get('/', (req, res) => send(res, listServices()));

router.post('/', (req, res) => {
  const { userId, ...fields } = req.body ?? {};
  send(res, createService(fields, userId), 201);
});

router.put('/:id', (req, res) => {
  const { userId, ...fields } = req.body ?? {};
  send(res, updateService(req.params.id, fields, userId));
});

router.patch('/:id/open', (req, res) => {
  const { userId, isOpen } = req.body ?? {};
  send(res, setServiceOpen(req.params.id, isOpen, userId));
});

export default router;
