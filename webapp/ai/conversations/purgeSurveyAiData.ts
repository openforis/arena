/**
 * What the browser forgets about a survey once it is deleted: its conversations, their open ids and its suggestions,
 * for every user of this browser.
 */
import { logAiWarning } from '@webapp/ai/log/aiLog'
import { suggestionStore, type SuggestionStore } from '@webapp/ai/suggestions/suggestionStore'

import { abortAssistantTurns, settleAssistantSaves } from '@webapp/components/ai/Assistant/assistantTurnRegistry'

import { getConversationStore, type ConversationStore } from './conversationStore'
import { browserOpenConversations, type OpenConversations } from './openConversations'

export type PurgeSurveyAiDataDeps = {
  // stops the running assistant answers and waits (bounded) for their last saves, which would write the survey back
  stopTurns?: () => Promise<void>
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
  ({ stopTurns, getConversationStore: openStore, openConversations, suggestions, log }: PurgeSurveyAiDataDeps) =>
  async (surveyId: number): Promise<void> => {
    // the running answers first: their final save would bring back what is deleted below; then the ids, since one
    // left behind would point to a deleted conversation
    const steps: [what: string, run: () => unknown][] = [
      ['running answers', () => stopTurns?.()],
      ['open conversations', () => openConversations.clearSurvey(surveyId)],
      ['suggestions', () => suggestions.removeSurvey(surveyId)],
      ['conversations', async () => (await openStore()).removeSurvey(surveyId)],
    ]
    for (const [what, run] of steps) {
      try {
        await run()
      } catch (error) {
        log(
          `The ${what} of survey ${surveyId} could not be ${what === 'running answers' ? 'stopped' : 'deleted from this browser'}`,
          error
        )
      }
    }
  }

export const purgeSurveyAiData = createPurgeSurveyAiData({
  stopTurns: async () => {
    abortAssistantTurns()
    await settleAssistantSaves()
  },
  getConversationStore,
  openConversations: browserOpenConversations,
  suggestions: suggestionStore,
  log: logAiWarning,
})
