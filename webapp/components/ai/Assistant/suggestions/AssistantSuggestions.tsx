import React from 'react'

import * as User from '@core/user/user'

import { SUGGESTION_DEFINITIONS } from '@webapp/ai/suggestions/definitions'
import { buildSuggestionRequest, dismissSuggestion } from '@webapp/ai/suggestions/suggestionActions'
import type { AssistantSuggestion } from '@webapp/ai/suggestions/types'
import { Button } from '@webapp/components/buttons'
import { useSurvey, useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { useI18nT, useLang } from '@webapp/store/system'
import { useUser } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import { assistantPanelStore } from '../assistantPanelStore'
import type { AssistantConversationApi } from '../useAssistantConversation'
import { canDoIt, getSuggestionCardText } from './suggestionsModel'

/**
 * The suggestion cards of the current area, above the messages: Do it (a new, scoped conversation) and Dismiss.
 * @param {object} props - Props.
 * @param {AssistantConversationApi} props.api - Conversation state of the chat (Do it waits for it).
 * @param {AssistantSuggestion[]} props.suggestions - Visible suggestions of the area.
 * @returns {React.ReactElement|null} The cards.
 */
export const AssistantSuggestions = ({
  api,
  suggestions,
}: {
  api: AssistantConversationApi
  suggestions: AssistantSuggestion[]
}) => {
  const t = useI18nT()
  const lang: string = useLang()
  const survey = useSurvey()
  const user = useUser()
  const userUuid: string | null = user ? User.getUuid(user) : null
  const surveyId: number | null = useSurveyId() ?? null
  const cycle: string | null = useSurveyCycleKey() ?? null
  if (!userUuid) return null

  const describeContext = { survey, t, lang }
  const cards = suggestions.flatMap((suggestion) => {
    const text = getSuggestionCardText({ suggestion, describeContext, definitions: SUGGESTION_DEFINITIONS })
    return text === null ? [] : [{ suggestion, text }]
  })
  if (cards.length === 0) return null

  /**
   * Opens the suggestion's area in a new conversation; the chat of that area claims and sends the request.
   * @param {AssistantSuggestion} suggestion - Visible suggestion.
   * @returns {void}
   */
  const onDoIt = (suggestion: AssistantSuggestion): void => {
    const request = buildSuggestionRequest({ suggestion, userUuid, surveyId, cycle, describeContext })
    if (request) assistantPanelStore.startWithPrompt(request)
  }

  return (
    <ul
      aria-label={t('aiSuggestions:listLabel')}
      className="ai-assistant-suggestions"
      data-testid={TestId.aiAssistant.suggestions}
    >
      {cards.map(({ suggestion, text }) => (
        <li
          className="ai-assistant-suggestions__card"
          data-testid={TestId.aiAssistant.suggestionCard}
          key={suggestion.id}
        >
          <p className="ai-assistant-suggestions__text">{text}</p>
          <div className="ai-assistant-suggestions__actions">
            <Button
              label="aiSuggestions:dismiss"
              onClick={() => dismissSuggestion({ suggestion, userUuid })}
              size="small"
              testId={TestId.aiAssistant.suggestionDismissBtn}
              variant="text"
            />
            <Button
              disabled={!canDoIt(api)}
              label="aiSuggestions:doIt"
              onClick={() => onDoIt(suggestion)}
              primary
              size="small"
              testId={TestId.aiAssistant.suggestionDoItBtn}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
