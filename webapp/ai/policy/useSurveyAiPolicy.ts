import { useEffect, useReducer, useState } from 'react'

import { useSurveyId } from '@webapp/store/survey'

import {
  fetchSurveyAiPolicy,
  onSurveyAiPolicyChange,
  peekSurveyAiPolicy,
  type SurveyAiPolicyClientState,
} from './surveyAiPolicyClient'

/**
 * Returns the current survey's AI policy state through the shared cache; re-renders when it changes
 * (update from the AI policy tab, invalidation).
 * @param {object} [options] - Options.
 * @param {boolean} [options.skip] - When true, nothing is fetched (e.g. AI off for the user).
 * @returns {{state: SurveyAiPolicyClientState|null, error: unknown}} The state (null until loaded) and the last error.
 */
export const useSurveyAiPolicy = ({ skip = false }: { skip?: boolean } = {}): {
  state: SurveyAiPolicyClientState | null
  error: unknown
} => {
  const surveyId = useSurveyId()
  const [, forceRender] = useReducer((count: number) => count + 1, 0)
  // the error is kept with its survey id, so it belongs to the current survey only
  const [failure, setFailure] = useState<{ surveyId: unknown; error: unknown } | null>(null)

  useEffect(() => {
    if (skip || !surveyId) return undefined
    let active = true
    const load = (): void => {
      fetchSurveyAiPolicy(surveyId)
        .then(() => {
          if (!active) return
          setFailure(null)
          forceRender()
        })
        .catch((loadError: unknown) => {
          if (active) setFailure({ surveyId, error: loadError })
        })
    }
    load()
    const unsubscribe = onSurveyAiPolicyChange((changedSurveyId) => {
      if (changedSurveyId === surveyId) load()
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [skip, surveyId])

  const error = !skip && failure && failure.surveyId === surveyId ? failure.error : null
  return { state: skip || !surveyId ? null : peekSurveyAiPolicy(surveyId), error }
}
