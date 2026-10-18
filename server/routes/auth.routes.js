// OWNER: Celeste
//
// The HTTP layer for authentication. No rules in this file: read the request,
// call the module, send the response. The `send` helper below does the same
// thing for every endpoint.

import { Router } from 'express';
import { registerUser, loginUser } from '../modules/auth.js';

const router = Router();

// Turns an ok()/fail() result into an HTTP response.
const send = (res, result, successStatus = 200) =>
  result.ok
    ? res.status(successStatus).json(result.data)
    : res.status(result.status).json({ error: result.error });

router.post('/register', (req, res) => send(res, registerUser(req.body), 201));

router.post('/login', (req, res) => send(res, loginUser(req.body)));

export default router;
