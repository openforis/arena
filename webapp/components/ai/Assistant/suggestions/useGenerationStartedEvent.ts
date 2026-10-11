/**
 * Tells the event detectors that a generation started (they fetch server data a state detector cannot), and drops
 * the category item refs of every conversation when the open survey changes or closes.
 */
import { useEffect, useState } from 'react'

import { notifySuggestionEvent } from '@webapp/ai/suggestions/suggestionEvents'
import type { SuggestionEvent } from '@webapp/ai/suggestions/detectors'
import { categoryItemRefsRegistry } from '@webapp/ai/tools/design/categoryItemRefs'

type GenerationRef = { id: number; surveyId: number } | null

export type GenerationStartNotifier = { update: (params: { generation: GenerationRef; active: boolean }) => void }

/**
 * Creates the notifier (pure, so it is tested without React).
 * @param {object} params - Parameters.
 * @param {Function} params.notify - Sends a suggestion event.
 * @param {Function} params.clearRefs - Drops the item refs.
 * @returns {GenerationStartNotifier} The notifier.
 */
export const createGenerationStartNotifier = ({
  notify,
  clearRefs,
}: {
  notify: (event: SuggestionEvent) => void
  clearRefs: () => void
}): GenerationStartNotifier => {
  let lastGenerationId: number | null = null
  let lastSurveyId: number | null = null
  let wasActive = false
  return {
    update: ({ generation, active }) => {
      const surveyId = generation?.surveyId ?? null
      if (surveyId !== lastSurveyId) clearRefs()
      // a new generation, or the setting turned on (Design available) on the current one
      const started = generation !== null && active && (generation.id !== lastGenerationId || !wasActive)
      lastGenerationId = generation?.id ?? null
      lastSurveyId = surveyId
      wasActive = active
      if (started) notify({ type: 'generationStarted' })
    },
  }
}

/**
 * Sends generationStarted; call it after the effect that feeds the controller, so the event finds the generation.
 * @param {object} params - Parameters.
 * @param {GenerationRef} params.generation - Current generation.
 * @param {boolean} params.active - Setting on, user logged in and Design available.
 * @returns {void}
 */
export const useGenerationStartedEvent = ({
  generation,
  active,
}: {
  generation: GenerationRef
  active: boolean
}): void => {
  const [notifier] = useState(() =>
    createGenerationStartNotifier({
      notify: notifySuggestionEvent,
      clearRefs: () => categoryItemRefsRegistry.clearAll(),
    })
  )
  useEffect(() => {
    notifier.update({ generation, active })
  }, [active, generation, notifier])
}
