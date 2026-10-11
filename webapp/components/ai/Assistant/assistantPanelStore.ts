/**
 * Panel state shared by the header button, the keyboard shortcut and the panel (no Redux: it is UI-only and the
 * panel code is lazy loaded). The open conversation of each area is remembered per user and survey (scope).
 */
import { browserOpenConversations, type OpenConversations } from '@webapp/ai/conversations/openConversations'
import type { SuggestionRequest } from '@webapp/ai/suggestions/types'

import type { AssistantArea } from './assistantAreas'

export type AssistantPanelView = 'chat' | 'history'

// whose open conversations the panel restores: set by the panel host from the logged-in user and the survey
export type AssistantPanelScope = { userUuid: string; surveyId: number | null }

export type AssistantPanelState = {
  open: boolean
  area: AssistantArea | null
  // set by a tab click, cleared when the panel closes (the automatic selection doesn't override it)
  userSelectedArea: AssistantArea | null
  conversationId: string | null
  view: AssistantPanelView
  // composer text set by openWithDraft, never sent by itself
  draft: string | null
  // area the draft was made for: another area's composer ignores it
  draftArea: AssistantArea | null
  scope: AssistantPanelScope | null
  // a suggestion's Do it waiting for the chat of its area to send it (claimed once)
  pendingRequest: SuggestionRequest | null
}

export const initialAssistantPanelState: AssistantPanelState = {
  open: false,
  area: null,
  userSelectedArea: null,
  conversationId: null,
  view: 'chat',
  draft: null,
  draftArea: null,
  scope: null,
  pendingRequest: null,
}

export type AssistantPanelStore = {
  getState: () => AssistantPanelState
  subscribe: (listener: () => void) => () => void
  open: () => void
  close: () => void
  toggle: () => void
  setScope: (scope: AssistantPanelScope | null) => void
  setArea: (area: AssistantArea | null, options?: { byUser?: boolean }) => void
  setConversationId: (conversationId: string | null) => void
  showHistory: () => void
  showChat: () => void
  // opens an area as a user choice (the automatic selection keeps it), in a new conversation, with a composer text
  openWithDraft: (params: { area: AssistantArea; draft: string }) => void
  clearDraft: () => void
  // Do it: opens the suggestion's area in a new conversation; the chat claims and sends the request
  startWithPrompt: (request: SuggestionRequest) => void
  // returns and clears the pending request when the id matches (so it is sent at most once)
  claimPendingRequest: (requestId: string) => SuggestionRequest | null
  reset: () => void
}

/**
 * Returns true when two scopes are the same user and survey (two nulls are the same).
 * @param {AssistantPanelScope|null} a - Scope.
 * @param {AssistantPanelScope|null} b - Scope.
 * @returns {boolean} True when equal.
 */
const sameScope = (a: AssistantPanelScope | null, b: AssistantPanelScope | null): boolean =>
  a?.userUuid === b?.userUuid && a?.surveyId === b?.surveyId

/**
 * Creates a panel store.
 * @param {object} [params] - Parameters.
 * @param {OpenConversations} [params.openConversations] - Remembered open conversations (default: localStorage).
 * @returns {AssistantPanelStore} The store.
 */
export const createAssistantPanelStore = ({
  openConversations = browserOpenConversations,
}: { openConversations?: OpenConversations } = {}): AssistantPanelStore => {
  let state = initialAssistantPanelState
  const listeners = new Set<() => void>()
  /**
   * Merges changes into the state and notifies the listeners.
   * @param {Partial<AssistantPanelState>} changes - State changes.
   * @returns {void}
   */
  const set = (changes: Partial<AssistantPanelState>) => {
    state = { ...state, ...changes }
    for (const listener of listeners) listener()
  }
  /**
   * Returns the remembered open conversation of an area.
   * @param {AssistantPanelScope|null} scope - User and survey.
   * @param {AssistantArea|null} area - Area.
   * @returns {string|null} The conversation id, or null.
   */
  const openIdOf = (scope: AssistantPanelScope | null, area: AssistantArea | null): string | null =>
    scope && area ? openConversations.get({ ...scope, area }) : null
  /**
   * Remembers (or forgets, with null) the conversation of the current area.
   * @param {string|null} conversationId - Conversation id.
   * @returns {void}
   */
  const remember = (conversationId: string | null) => {
    if (state.scope && state.area) openConversations.set({ ...state.scope, area: state.area, conversationId })
  }
  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    open: () => set({ open: true }),
    close: () => set({ open: false, userSelectedArea: null, view: 'chat' }),
    toggle: () => (state.open ? set({ open: false, userSelectedArea: null, view: 'chat' }) : set({ open: true })),
    setScope: (scope) => {
      if (sameScope(state.scope, scope)) return
      // another user or survey: the current area shows that survey's open conversation; a request made for the
      // previous survey is never sent
      set({ scope, conversationId: openIdOf(scope, state.area), pendingRequest: null })
    },
    setArea: (area, { byUser = false } = {}) =>
      set({
        area,
        view: 'chat',
        // each area shows its own open conversation
        conversationId: area === state.area ? state.conversationId : openIdOf(state.scope, area),
        // a draft made for another area is dropped
        ...(area === state.draftArea ? {} : { draft: null, draftArea: null }),
        // a suggestion request belongs to its area
        ...(area === state.area ? {} : { pendingRequest: null }),
        ...(byUser ? { userSelectedArea: area } : {}),
      }),
    setConversationId: (conversationId) => {
      remember(conversationId)
      set({ conversationId, view: 'chat' })
    },
    showHistory: () => set({ view: 'history' }),
    showChat: () => set({ view: 'chat' }),
    openWithDraft: ({ area, draft }) => {
      set({ open: true, area, userSelectedArea: area, conversationId: null, view: 'chat', draft, draftArea: area })
      // the draft is a new question: the previous conversation stays in History
      remember(null)
    },
    clearDraft: () => set({ draft: null, draftArea: null }),
    startWithPrompt: (request) => {
      set({
        open: true,
        area: request.area,
        userSelectedArea: request.area,
        conversationId: null,
        view: 'chat',
        pendingRequest: request,
      })
      // a new conversation: the previous one stays in History
      remember(null)
    },
    claimPendingRequest: (requestId) => {
      const request = state.pendingRequest
      if (request?.requestId !== requestId) return null
      set({ pendingRequest: null })
      return request
    },
    reset: () => set(initialAssistantPanelState),
  }
}

export const assistantPanelStore = createAssistantPanelStore()
