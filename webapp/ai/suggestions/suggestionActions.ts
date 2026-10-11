/**
 * What the suggestion cards do. Do it builds a scoped request that the chat of its area claims once and sends; the
 * suggestion is then put in progress (or removed) only when a turn was created. Dismiss hides the visible targets.
 */
import { uuidv4 } from '@core/uuid'

import type { AssistantArea } from '@webapp/components/ai/Assistant/assistantAreas'

import { SUGGESTION_DEFINITIONS, type SuggestionDefinition, type SuggestionDescribeContext } from './definitions'
import { suggestionStore, type SuggestionStore } from './suggestionStore'
import type { AssistantSuggestion, SuggestionKind, SuggestionRequest, SuggestionScope } from './types'

export type SuggestionDefinitions = Partial<Record<SuggestionKind, SuggestionDefinition>>

// where a request may be sent: the chat's user, survey, cycle and area
export type SuggestionRequestScope = {
  userUuid: string
  surveyId: number | null
  cycle: string | null
  area: AssistantArea
}

// the conversation hook's send (resolves with the new conversation id, or null when no turn was created)
export type SuggestionSend = (
  text: string,
  options: { suggestion: { id: string; scope: SuggestionScope } }
) => Promise<string | null>

/**
 * Returns the store bucket of the suggestion of a request: Help suggestions belong to no survey (deviation 3).
 * @param {SuggestionRequest} request - Request.
 * @returns {number|null} The survey id of the bucket.
 */
export const getRequestBucketSurveyId = (request: Pick<SuggestionRequest, 'area' | 'surveyId'>): number | null =>
  request.area === 'help' ? null : request.surveyId

/**
 * Builds the request of Do it from a visible suggestion (its targets are the visible ones).
 * @param {object} params - Parameters.
 * @param {AssistantSuggestion} params.suggestion - Visible suggestion.
 * @param {string} params.userUuid - User.
 * @param {number|null} params.surveyId - Survey open now.
 * @param {string|null} params.cycle - Cycle now.
 * @param {SuggestionDescribeContext} params.describeContext - Survey, translation and language of the prompt.
 * @param {SuggestionDefinitions} [params.definitions] - Definitions.
 * @param {Function} [params.newId] - Request id factory.
 * @returns {SuggestionRequest|null} The request; null without a definition, a target or a prompt.
 */
export const buildSuggestionRequest = ({
  suggestion,
  userUuid,
  surveyId,
  cycle,
  describeContext,
  definitions = SUGGESTION_DEFINITIONS,
  newId = () => uuidv4(),
}: {
  suggestion: AssistantSuggestion
  userUuid: string
  surveyId: number | null
  cycle: string | null
  describeContext: SuggestionDescribeContext
  definitions?: SuggestionDefinitions
  newId?: () => string
}): SuggestionRequest | null => {
  const definition = definitions[suggestion.kind]
  if (!definition || suggestion.targets.length === 0) return null
  let prompt: string
  try {
    prompt = definition.prompt(suggestion, describeContext)
  } catch {
    // a target that no longer describes (e.g. a node def deleted meanwhile): nothing is sent
    return null
  }
  return {
    requestId: newId(),
    userUuid,
    surveyId,
    cycle,
    area: suggestion.area,
    suggestionId: suggestion.id,
    scope: { kind: suggestion.kind, targetKeys: suggestion.targets.map((target) => target.key) },
    prompt,
  }
}

/**
 * Returns true when a request was made for this user, survey, cycle and area.
 * @param {SuggestionRequest} request - Request.
 * @param {SuggestionRequestScope} scope - Scope of the chat.
 * @returns {boolean} True when it may be sent here.
 */
export const isRequestForScope = (request: SuggestionRequest, scope: SuggestionRequestScope): boolean =>
  request.userUuid === scope.userUuid &&
  request.surveyId === scope.surveyId &&
  request.cycle === scope.cycle &&
  request.area === scope.area

/**
 * Claims the pending request (at most once) and returns it when it belongs to the chat's scope; a request of another
 * scope is claimed too, so it is dropped and never sent.
 * @param {object} params - Parameters.
 * @param {SuggestionRequest|null} params.pending - The panel's pending request.
 * @param {SuggestionRequestScope} params.scope - Scope of the chat.
 * @param {Function} params.claim - The panel store's claimPendingRequest.
 * @returns {SuggestionRequest|null} The request to send.
 */
export const takeRequestForScope = ({
  pending,
  scope,
  claim,
}: {
  pending: SuggestionRequest | null
  scope: SuggestionRequestScope
  claim: (requestId: string) => SuggestionRequest | null
}): SuggestionRequest | null => {
  if (!pending) return null
  const request = claim(pending.requestId)
  return request && isRequestForScope(request, scope) ? request : null
}

/**
 * Sends a claimed request; once the turn exists, puts the suggestion in progress for it (or removes it).
 * @param {object} params - Parameters.
 * @param {SuggestionRequest} params.request - Claimed request.
 * @param {SuggestionSend} params.send - The conversation hook's send.
 * @param {SuggestionStore} [params.store] - Store.
 * @param {SuggestionDefinitions} [params.definitions] - Definitions.
 * @returns {Promise<string|null>} The new conversation id; null when nothing was sent (nothing changes).
 */
export const acceptSuggestion = async ({
  request,
  send,
  store = suggestionStore,
  definitions = SUGGESTION_DEFINITIONS,
}: {
  request: SuggestionRequest
  send: SuggestionSend
  store?: SuggestionStore
  definitions?: SuggestionDefinitions
}): Promise<string | null> => {
  const { userUuid, suggestionId: id, scope } = request
  const conversationId = await send(request.prompt, { suggestion: { id, scope } })
  if (!conversationId) return null
  const surveyId = getRequestBucketSurveyId(request)
  const definition = definitions[scope.kind]
  if (definition?.acceptMode === 'remove') store.remove({ userUuid, surveyId, id })
  else store.startProgress({ userUuid, surveyId, id, conversationId })
  definition?.onHandled?.({ userUuid, targetKeys: scope.targetKeys, store })
  return conversationId
}

/**
 * Dismisses the visible targets of a suggestion.
 * @param {object} params - Parameters.
 * @param {AssistantSuggestion} params.suggestion - Visible suggestion.
 * @param {string} params.userUuid - User.
 * @param {SuggestionStore} [params.store] - Store.
 * @param {SuggestionDefinitions} [params.definitions] - Definitions.
 * @returns {void}
 */
export const dismissSuggestion = ({
  suggestion,
  userUuid,
  store = suggestionStore,
  definitions = SUGGESTION_DEFINITIONS,
}: {
  suggestion: AssistantSuggestion
  userUuid: string
  store?: SuggestionStore
  definitions?: SuggestionDefinitions
}): void => {
  store.dismiss({ userUuid, surveyId: suggestion.surveyId, id: suggestion.id })
  const targetKeys = suggestion.targets.map((target) => target.key)
  definitions[suggestion.kind]?.onHandled?.({ userUuid, targetKeys, store })
}
