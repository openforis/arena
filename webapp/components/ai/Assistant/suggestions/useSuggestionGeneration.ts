/**
 * The suggestion generation of the open survey (user, survey, cycle, draft, canEditSurvey, defs load). The same
 * values return the same generation object, so effects that depend on it run only when a new generation starts.
 */
import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import * as User from '@core/user/user'

import {
  createGenerationTracker,
  type SuggestionGeneration,
  toGenerationInput,
} from '@webapp/ai/suggestions/generation'
import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import * as SurveyStatusState from '@webapp/store/survey/status/state'
import { useAuthCanEditSurvey, useUser } from '@webapp/store/user'

/**
 * Returns the current generation (null while no survey's defs are loaded).
 * @returns {SuggestionGeneration|null} The generation.
 */
export const useSuggestionGeneration = (): SuggestionGeneration | null => {
  const [tracker] = useState(createGenerationTracker)
  const user = useUser()
  const userUuid: string | null = user ? User.getUuid(user) : null
  const surveyId: number | null = useSurveyId() ?? null
  const cycle: string | null = useSurveyCycleKey() ?? null
  const fetched: boolean = useSelector((state: any) => SurveyStatusState.isFetched(state))
  const draft: boolean = useSelector((state: any) => SurveyStatusState.isDraft(state))
  const loadCount: number = useSelector((state: any) => SurveyStatusState.getDefsLoadCount(state))
  const canEditSurvey: boolean = useAuthCanEditSurvey()

  // aborts the last generation's signal when the host goes away
  useEffect(() => () => tracker.end(), [tracker])

  // next() is idempotent for the same values; the memo keeps it out of unrelated renders
  return useMemo(
    () => tracker.next(toGenerationInput({ userUuid, surveyId, cycle, fetched, draft, canEditSurvey, loadCount })),
    [canEditSurvey, cycle, draft, fetched, loadCount, surveyId, tracker, userUuid]
  )
}
