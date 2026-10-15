/**
 * The visible suggestions (index contract): the open survey's and Help's, in available areas; none while the setting
 * is off. Re-read on every store change (this tab or another) and when one expires.
 */
import { useEffect, useMemo, useState } from 'react'

import * as User from '@core/user/user'

import { AiFeatureCategory } from '@common/ai/features'

import { suggestionStore } from '@webapp/ai/suggestions/suggestionStore'
import type { AssistantSuggestion } from '@webapp/ai/suggestions/types'
import { useAiFeatureEnabled } from '@webapp/components/ai/hooks/useAiFeatureEnabled'
import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { useUser } from '@webapp/store/user'

import type { AssistantArea } from '../assistantAreas'
import { useAssistantAreas } from '../useAssistantAreas'
import {
  getAvailableAreas,
  getNextExpiryDelay,
  groupSuggestionsByArea,
  type SuggestionsByArea,
} from './suggestionsModel'

/**
 * Returns the visible suggestions, all and by area.
 * @returns {{all: AssistantSuggestion[], byArea: SuggestionsByArea}} The suggestions.
 */
export const useVisibleSuggestions = (): { all: AssistantSuggestion[]; byArea: SuggestionsByArea } => {
  const user = useUser()
  const userUuid: string | null = user ? User.getUuid(user) : null
  const surveyId: number | null = useSurveyId() ?? null
  const cycle: string | null = useSurveyCycleKey() ?? null
  const enabled: boolean = useAiFeatureEnabled(AiFeatureCategory.assistantSuggestions)
  const { statuses } = useAssistantAreas()
  // a string, so the effect runs only when the set of areas changes
  const areasKey = getAvailableAreas(statuses).join(',')
  const [all, setAll] = useState<AssistantSuggestion[]>([])

  useEffect(() => {
    const availableAreas = (areasKey ? areasKey.split(',') : []) as AssistantArea[]
    let timer: ReturnType<typeof setTimeout> | null = null
    /**
     * Re-reads the store; keeps the previous array when nothing changed (no re-render).
     * @returns {void}
     */
    const refresh = (): void => {
      const next = userUuid ? suggestionStore.getVisible({ userUuid, surveyId, cycle, availableAreas, enabled }) : []
      setAll((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
      if (timer) clearTimeout(timer)
      const delay = getNextExpiryDelay(next, new Date())
      timer = delay === null ? null : setTimeout(refresh, delay)
    }
    refresh()
    const unsubscribe = suggestionStore.subscribe(refresh)
    return () => {
      unsubscribe()
      if (timer) clearTimeout(timer)
    }
  }, [areasKey, cycle, enabled, surveyId, userUuid])

  const byArea = useMemo(() => groupSuggestionsByArea(all), [all])
  return { all, byArea }
}
