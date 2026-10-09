/**
 * What the UI offers for an unavailable feature or a failed engine call: actions and retry. Pure.
 */
import { getAiErrorKey } from '@webapp/ai/runtime/runtimeErrors'

import { type AiUnavailableAction, getAiUnavailableAction } from './featureAvailability'
import type { AiUnavailableReason } from './types'

export type AiEngineErrorView = { retry: boolean; openSettings: boolean }

// errors the user can fix outside Arena (start LM Studio, load a model) or in the settings (the appErrors text has the hint)
const ENGINE_ERROR_VIEWS: Record<string, AiEngineErrorView> = {
  aiLocalServerUnreachable: { retry: true, openSettings: true },
  aiLocalServerModelMissing: { retry: true, openSettings: true },
  aiLocalServerError: { retry: true, openSettings: false },
  aiLocalServerContextExceeded: { retry: false, openSettings: false },
  aiNoEngineAvailable: { retry: true, openSettings: true },
}

/**
 * Returns the actions offered for the reasons, once each, in the reasons' order.
 * @param {object} params - Parameters.
 * @param {AiUnavailableReason[]} params.reasons - Reasons.
 * @param {boolean} params.canChangePolicy - The user may edit this survey's AI policy (and the request has a survey).
 * @returns {AiUnavailableAction[]} The actions.
 */
export const getAiUnavailableActions = ({
  reasons,
  canChangePolicy,
}: {
  reasons: AiUnavailableReason[]
  canChangePolicy: boolean
}): AiUnavailableAction[] => {
  const actions = reasons.map(getAiUnavailableAction).filter((action) => action !== 'changePolicy' || canChangePolicy)
  return [...new Set(actions)]
}

/**
 * Returns the buttons to show with an AI error, or null when the error is not an engine error.
 * @param {unknown} error - The error (as thrown by resolveModel or the local server fetch), or a `{ key }` object.
 * @returns {AiEngineErrorView|null} The view.
 */
export const getAiEngineErrorView = (error: unknown): AiEngineErrorView | null => {
  const key = getAiErrorKey(error)
  return key ? (ENGINE_ERROR_VIEWS[key] ?? null) : null
}
