/**
 * Strips the server-only prefs (AI providers with their encrypted keys, AI usage) from the login responses. They are
 * sent by `@openforis/arena-server`, whose code this repository cannot change: `res.json` is wrapped before its routes
 * run, so the user it sends never carries those keys.
 */
import type { NextFunction, Request, Response } from 'express'

import { omitServerOnlyPrefsFromUser } from '@server/modules/user/serverOnlyPrefs'

// /auth/login and /auth/login/temp, with or without a trailing slash; Express routes ignore the case
const LOGIN_PATH_PATTERN = /^\/auth\/login(\/temp)?\/?$/i

/**
 * Returns the response body of a login with the user's server-only prefs removed.
 * @param {unknown} body - Response body (`{ user, survey, authToken }` after a login).
 * @returns {unknown} The body, with the user filtered when it has one; other bodies are returned as is.
 */
export const omitServerOnlyPrefsFromLoginBody = (body: unknown): unknown => {
  if (!body || typeof body !== 'object' || !('user' in body)) return body
  return { ...body, user: omitServerOnlyPrefsFromUser((body as { user: unknown }).user) }
}

/**
 * Express middleware (register it before the routes of arena-server): wraps `res.json` of the login routes.
 * @param {Request} req - Request.
 * @param {Response} res - Response.
 * @param {NextFunction} next - Next handler.
 * @returns {void}
 */
export const stripServerOnlyPrefsFromLoginResponse = (req: Request, res: Response, next: NextFunction): void => {
  if (LOGIN_PATH_PATTERN.test(req.path)) {
    const sendJson = res.json.bind(res)
    res.json = (body?: unknown) => sendJson(omitServerOnlyPrefsFromLoginBody(body))
  }
  next()
}
