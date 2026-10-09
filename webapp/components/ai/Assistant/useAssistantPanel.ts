import { useSyncExternalStore } from 'react'

import { assistantPanelStore, type AssistantPanelState } from './assistantPanelStore'

/**
 * Returns the panel state; re-renders on every change.
 * @returns {AssistantPanelState} The state.
 */
export const useAssistantPanel = (): AssistantPanelState =>
  useSyncExternalStore(assistantPanelStore.subscribe, assistantPanelStore.getState)

/**
 * Returns the action that opens an area in a new conversation with a composer text.
 * @returns {Function} openWithDraft({ area, draft }).
 */
export const useAssistantOpenWithDraft = () => assistantPanelStore.openWithDraft
