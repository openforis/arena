import { useSyncExternalStore } from 'react'

import { assistantPanelStore, type AssistantPanelState } from './assistantPanelStore'

/**
 * Returns the panel state; re-renders on every change.
 * @returns {AssistantPanelState} The state.
 */
export const useAssistantPanel = (): AssistantPanelState =>
  useSyncExternalStore(assistantPanelStore.subscribe, assistantPanelStore.getState)
