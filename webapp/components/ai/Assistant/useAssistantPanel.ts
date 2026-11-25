import { useSyncExternalStore } from 'react'

import { type AssistantPanelState, assistantPanelStore } from './assistantPanelStore'

/**
 * Returns the panel state; re-renders on every change.
 * @returns {AssistantPanelState} The state.
 */
export const useAssistantPanel = (): AssistantPanelState =>
  useSyncExternalStore(assistantPanelStore.subscribe, assistantPanelStore.getState)
