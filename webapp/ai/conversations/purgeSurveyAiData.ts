/**
 * What the browser forgets about a survey once it is deleted: its conversations, their open ids and its suggestions,
 * for every user of this browser.
 */
import { logAiWarning } from '@webapp/ai/log/aiLog'
import { suggestionStore, type SuggestionStore } from '@webapp/ai/suggestions/suggestionStore'

import { getConversationStore, type ConversationStore } from './conversationStore'
import { browserOpenConversations, type OpenConversations } from './openConversations'

export type PurgeSurveyAiDataDeps = {
  getConversationStore: () => Promise<Pick<ConversationStore, 'removeSurvey'>>
  openConversations: Pick<OpenConversations, 'clearSurvey'>
  suggestions: Pick<SuggestionStore, 'removeSurvey'>
  log: (message: string, error?: unknown) => void
}

/**
 * Creates the purge of a deleted survey's AI data.
 * @param {PurgeSurveyAiDataDeps} deps - The stores and the log.
 * @returns {Function} The purge: it never rejects (the deletion of the survey does not depend on it), and a step that
 * fails does not stop the others.
 */
export const createPurgeSurveyAiData =
  ({ getConversationStore: openStore, openConversations, suggestions, log }: PurgeSurveyAiDataDeps) =>
  async (surveyId: number): Promise<void> => {
    // the ids first: one left behind would point to a deleted conversation
    const steps: [what: string, run: () => unknown][] = [
      ['open conversations', () => openConversations.clearSurvey(surveyId)],
      ['suggestions', () => suggestions.removeSurvey(surveyId)],
      ['conversations', async () => (await openStore()).removeSurvey(surveyId)],
    ]
    for (const [what, run] of steps) {
      try {
        await run()
      } catch (error) {
        log(`The ${what} of survey ${surveyId} could not be deleted from this browser`, error)
      }
    }
  }

export const purgeSurveyAiData = createPurgeSurveyAiData({
  getConversationStore,
  openConversations: browserOpenConversations,
  suggestions: suggestionStore,
  log: logAiWarning,
})
