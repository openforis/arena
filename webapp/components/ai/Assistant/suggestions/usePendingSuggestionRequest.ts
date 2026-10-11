/**
 * The claim effect of Do it: once the chat's conversation store is open and neither an answer nor an Apply runs, the
 * chat claims the panel's pending request (at most once) and sends it when it was made for this user, survey, cycle
 * and area. A request of another scope is dropped.
 */
import { useEffect } from 'react'

import * as User from '@core/user/user'

import { acceptSuggestion, takeRequestForScope } from '@webapp/ai/suggestions/suggestionActions'
import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { useUser } from '@webapp/store/user'

import type { AssistantArea } from '../assistantAreas'
import { assistantPanelStore } from '../assistantPanelStore'
import type { AssistantConversationApi } from '../useAssistantConversation'
import { useAssistantPanel } from '../useAssistantPanel'
import { canDoIt } from './suggestionsModel'

/**
 * Claims and sends the pending suggestion request of this chat.
 * @param {object} params - Parameters.
 * @param {AssistantConversationApi} params.api - Conversation state and actions of the chat.
 * @param {AssistantArea} params.area - Area of the chat.
 * @returns {void}
 */
export const usePendingSuggestionRequest = ({ api, area }: { api: AssistantConversationApi; area: AssistantArea }) => {
  const { pendingRequest } = useAssistantPanel()
  const user = useUser()
  const userUuid: string | null = user ? User.getUuid(user) : null
  const surveyId: number | null = useSurveyId() ?? null
  const cycle: string | null = useSurveyCycleKey() ?? null
  const { ready, busy, applying, send } = api

  useEffect(() => {
    if (!pendingRequest || !userUuid || !canDoIt({ ready, busy, applying })) return
    const request = takeRequestForScope({
      pending: pendingRequest,
      scope: { userUuid, surveyId, cycle, area },
      claim: assistantPanelStore.claimPendingRequest,
    })
    // in progress (or removed) only once send created the turn
    if (request) void acceptSuggestion({ request, send })
  }, [applying, area, busy, cycle, pendingRequest, ready, send, surveyId, userUuid])
}
