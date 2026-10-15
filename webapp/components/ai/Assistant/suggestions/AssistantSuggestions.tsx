import React, { useState } from 'react'

import * as User from '@core/user/user'

import { SUGGESTION_DEFINITIONS } from '@webapp/ai/suggestions/registry'
import { buildSuggestionRequest, dismissSuggestion } from '@webapp/ai/suggestions/suggestionActions'
import type { AssistantSuggestion } from '@webapp/ai/suggestions/types'
import { Button } from '@webapp/components/buttons'
import { useSurvey, useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { useI18nT, useLang } from '@webapp/store/system'
import { useUser } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import { assistantPanelStore } from '../assistantPanelStore'
import type { AssistantConversationApi } from '../useAssistantConversation'
import { canDoIt, getStartScreenSuggestions, getSuggestionCardText } from './suggestionsModel'

type SuggestionCard = { suggestion: AssistantSuggestion; text: string }

/**
 * One suggestion: a row with its text, opened into the card with Dismiss and Do it.
 * @param {object} props - Props.
 * @param {SuggestionCard} props.card - Suggestion and its text.
 * @param {boolean} props.open - The card is open.
 * @param {Function} props.onToggle - Opens or closes the card.
 * @param {boolean} props.canDoIt - Do it is enabled.
 * @param {Function} props.onDismiss - Dismisses the suggestion.
 * @param {Function} props.onDoIt - Starts its conversation.
 * @returns {React.ReactElement} The item.
 */
const SuggestionItem = ({
  card,
  open,
  onToggle,
  canDoIt: doItEnabled,
  onDismiss,
  onDoIt,
}: {
  card: SuggestionCard
  open: boolean
  onToggle: () => void
  canDoIt: boolean
  onDismiss: () => void
  onDoIt: () => void
}) => (
  <li
    className={`ai-assistant-suggestions__card${open ? ' ai-assistant-suggestions__card--open' : ''}`}
    data-testid={TestId.aiAssistant.suggestionCard}
  >
    <button
      aria-expanded={open}
      className="ai-assistant-suggestions__toggle"
      data-testid={TestId.aiAssistant.suggestionToggle}
      onClick={onToggle}
      title={open ? undefined : card.text}
      type="button"
    >
      <span className="ai-assistant-suggestions__text">{card.text}</span>
      <span aria-hidden="true" className="ai-assistant-suggestions__chevron" />
    </button>
    {open && (
      <div className="ai-assistant-suggestions__actions">
        <Button
          label="aiSuggestions:dismiss"
          onClick={onDismiss}
          size="small"
          testId={TestId.aiAssistant.suggestionDismissBtn}
          variant="text"
        />
        <Button
          disabled={!doItEnabled}
          label="aiSuggestions:doIt"
          onClick={onDoIt}
          primary
          size="small"
          testId={TestId.aiAssistant.suggestionDoItBtn}
        />
      </div>
    )}
  </li>
)

/**
 * The suggestions of the current area as rows; a row opens into its card (one at a time): Do it (a new, scoped
 * conversation) and Dismiss. On the home page only the first ones show, with "See all".
 * @param {object} props - Props.
 * @param {AssistantConversationApi} props.api - Conversation state of the chat (Do it waits for it).
 * @param {AssistantSuggestion[]} props.suggestions - Visible suggestions of the area.
 * @param {string} [props.heading] - Section heading, shown only when there are suggestions.
 * @param {boolean} [props.startScreen] - Home page: the first suggestions and "See all".
 * @returns {React.ReactElement|null} The suggestions.
 */
export const AssistantSuggestions = ({
  api,
  suggestions,
  heading,
  startScreen = false,
}: {
  api: AssistantConversationApi
  suggestions: AssistantSuggestion[]
  heading?: string
  startScreen?: boolean
}) => {
  const t = useI18nT()
  const lang: string = useLang()
  const survey = useSurvey()
  const user = useUser()
  const [openId, setOpenId] = useState<string | null>(null)
  const userUuid: string | null = user ? User.getUuid(user) : null
  const surveyId: number | null = useSurveyId() ?? null
  const cycle: string | null = useSurveyCycleKey() ?? null
  if (!userUuid) return null

  const describeContext = { survey, t, lang }
  const cards: SuggestionCard[] = suggestions.flatMap((suggestion) => {
    const text = getSuggestionCardText({ suggestion, describeContext, definitions: SUGGESTION_DEFINITIONS })
    return text === null ? [] : [{ suggestion, text }]
  })
  if (cards.length === 0) return null
  const { shown, total } = startScreen ? getStartScreenSuggestions(cards) : { shown: cards, total: cards.length }

  /**
   * Opens the suggestion's area in a new conversation; the chat of that area claims and sends the request.
   * @param {AssistantSuggestion} suggestion - Visible suggestion.
   * @returns {void}
   */
  const onDoIt = (suggestion: AssistantSuggestion): void => {
    const request = buildSuggestionRequest({ suggestion, userUuid, surveyId, cycle, describeContext })
    if (request) assistantPanelStore.startWithPrompt(request)
  }

  const list = (
    <ul
      aria-label={t('aiSuggestions:listLabel')}
      className="ai-assistant-suggestions"
      data-testid={TestId.aiAssistant.suggestions}
    >
      {shown.map((card) => (
        <SuggestionItem
          canDoIt={canDoIt(api)}
          card={card}
          key={card.suggestion.id}
          onDismiss={() => dismissSuggestion({ suggestion: card.suggestion, userUuid })}
          onDoIt={() => onDoIt(card.suggestion)}
          onToggle={() => setOpenId((current) => (current === card.suggestion.id ? null : card.suggestion.id))}
          open={openId === card.suggestion.id}
        />
      ))}
    </ul>
  )
  if (!heading) return list
  return (
    <section>
      <h3 className="ai-assistant-panel__section-title">{heading}</h3>
      {list}
      {total > shown.length && (
        <Button
          label="aiAssistant.start.seeAllSuggestions"
          labelParams={{ count: total }}
          onClick={assistantPanelStore.showSuggestions}
          size="small"
          testId={TestId.aiAssistant.seeAllSuggestionsBtn}
          variant="text"
        />
      )}
    </section>
  )
}
