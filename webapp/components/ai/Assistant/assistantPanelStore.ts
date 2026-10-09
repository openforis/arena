/**
 * Panel state shared by the header button, the keyboard shortcut and the panel (no Redux: it is UI-only and the
 * panel code is lazy loaded).
 */
import type { AssistantArea } from './assistantAreas'

export type AssistantPanelView = 'chat' | 'history'

export type AssistantPanelState = {
  open: boolean
  area: AssistantArea | null
  // set by a tab click, cleared when the panel closes (the automatic selection doesn't override it)
  userSelectedArea: AssistantArea | null
  conversationId: string | null
  view: AssistantPanelView
  // composer text set by openWithDraft, never sent by itself
  draft: string | null
}

export const initialAssistantPanelState: AssistantPanelState = {
  open: false,
  area: null,
  userSelectedArea: null,
  conversationId: null,
  view: 'chat',
  draft: null,
}

export type AssistantPanelStore = {
  getState: () => AssistantPanelState
  subscribe: (listener: () => void) => () => void
  open: () => void
  close: () => void
  toggle: () => void
  setArea: (area: AssistantArea | null, options?: { byUser?: boolean }) => void
  setConversationId: (conversationId: string | null) => void
  showHistory: () => void
  showChat: () => void
  // opens an area as a user choice (the automatic selection keeps it), in a new conversation, with a composer text
  openWithDraft: (params: { area: AssistantArea; draft: string }) => void
  clearDraft: () => void
  reset: () => void
}

/**
 * Creates a panel store.
 * @returns {AssistantPanelStore} The store.
 */
export const createAssistantPanelStore = (): AssistantPanelStore => {
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
  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    open: () => set({ open: true }),
    close: () => set({ open: false, userSelectedArea: null, view: 'chat' }),
    toggle: () => (state.open ? set({ open: false, userSelectedArea: null, view: 'chat' }) : set({ open: true })),
    setArea: (area, { byUser = false } = {}) =>
      set({
        area,
        view: 'chat',
        // another area: another conversation
        conversationId: area === state.area ? state.conversationId : null,
        ...(byUser ? { userSelectedArea: area } : {}),
      }),
    setConversationId: (conversationId) => set({ conversationId, view: 'chat' }),
    showHistory: () => set({ view: 'history' }),
    showChat: () => set({ view: 'chat' }),
    openWithDraft: ({ area, draft }) =>
      set({ open: true, area, userSelectedArea: area, conversationId: null, view: 'chat', draft }),
    clearDraft: () => set({ draft: null }),
    reset: () => set(initialAssistantPanelState),
  }
}

export const assistantPanelStore = createAssistantPanelStore()
