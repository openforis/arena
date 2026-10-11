/**
 * UI-less host of the suggestions, always mounted (also while the panel is closed or never opened): feeds the
 * controller, forwards the suggestion events, reports the module entered and the designer visits, and settles the
 * in-progress entries a reload left. Nothing here calls an AI engine.
 */
import { useEffect, useState } from 'react'

import * as User from '@core/user/user'

import { AiFeatureCategory } from '@common/ai/features'

import { getConversationStore } from '@webapp/ai/conversations/conversationStore'
import { reconcileInProgress } from '@webapp/ai/suggestions/reconcileInProgress'
import { notifySuggestionEvent, subscribeSuggestionEvents } from '@webapp/ai/suggestions/suggestionEvents'
import { createSuggestionHostController } from '@webapp/ai/suggestions/suggestionHostController'
import { suggestionStore } from '@webapp/ai/suggestions/suggestionStore'
import { useAiFeatureEnabled } from '@webapp/components/ai/hooks/useAiFeatureEnabled'
import { useSurvey, useSurveyId } from '@webapp/store/survey'
import { useUser } from '@webapp/store/user'

import type { AssistantArea, AssistantAreaStatus } from '../assistantAreas'
import { getAvailableAreas } from './suggestionsModel'
import { useDesignerVisit } from './useDesignerVisit'
import { useSuggestionGeneration } from './useSuggestionGeneration'

/**
 * Settles, for a user, the in-progress entries whose conversation ended in a tab that is gone.
 * @param {string} userUuid - User.
 * @param {Function} isCancelled - True once the user changed.
 * @returns {Promise<void>} Resolves when done.
 */
const reconcileUser = async (userUuid: string, isCancelled: () => boolean): Promise<void> => {
  const conversations = await getConversationStore()
  if (isCancelled()) return
  await reconcileInProgress({ store: suggestionStore, userUuid, load: (id) => conversations.get(id) })
}

/**
 * The suggestions host.
 * @param {object} props - Props.
 * @param {AssistantAreaStatus[]} props.statuses - Area statuses.
 * @param {string|null} props.module - App module.
 * @returns {null} Nothing.
 */
export const SuggestionsHost = ({ statuses, module }: { statuses: AssistantAreaStatus[]; module: string | null }) => {
  const [controller] = useState(() => createSuggestionHostController({ store: suggestionStore }))
  const user = useUser()
  const userUuid: string | null = user ? User.getUuid(user) : null
  const surveyId: number | null = useSurveyId() ?? null
  const survey = useSurvey()
  const enabled: boolean = useAiFeatureEnabled(AiFeatureCategory.assistantSuggestions)
  const generation = useSuggestionGeneration()
  // a string, so the effects run only when the set of areas changes
  const areasKey = getAvailableAreas(statuses).join(',')
  // only the defs of the generation reach a detector
  const generationSurvey = generation ? survey : null

  // first, so the events below see the current input
  useEffect(() => {
    const availableAreas = (areasKey ? areasKey.split(',') : []) as AssistantArea[]
    controller.update({ enabled, userUuid, surveyId, generation, survey: generationSurvey, availableAreas })
  }, [areasKey, controller, enabled, generation, generationSurvey, surveyId, userUuid])

  useEffect(() => subscribeSuggestionEvents((event) => controller.event(event)), [controller])

  useEffect(() => () => controller.dispose(), [controller])

  useDesignerVisit({ generation, survey: generationSurvey, module })

  const active = enabled && userUuid !== null
  const helpAvailable = areasKey.split(',').includes('help')
  // the detector skips modules already seen or offered; firing again when Help comes back is harmless
  useEffect(() => {
    if (active && helpAvailable && module) notifySuggestionEvent({ type: 'moduleEntered', module })
  }, [active, helpAvailable, module])

  useEffect(() => {
    if (!userUuid) return undefined
    let cancelled = false
    // without a conversation store (blocked IndexedDB) there is nothing to settle
    reconcileUser(userUuid, () => cancelled).catch(() => null)
    return () => {
      cancelled = true
    }
  }, [userUuid])

  return null
}
