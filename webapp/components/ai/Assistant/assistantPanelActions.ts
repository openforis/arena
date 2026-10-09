/**
 * Panel actions shared by the button, the shortcut and the panel (kept out of the lazy panel chunk).
 */
import { TestId } from '@webapp/utils/testId'

import { assistantPanelStore } from './assistantPanelStore'

/**
 * Closes the panel and gives the focus back to the header button.
 * @returns {void}
 */
export const closeAssistantPanel = (): void => {
  assistantPanelStore.close()
  document.querySelector<HTMLElement>(`[data-testid="${TestId.aiAssistant.openBtn}"]`)?.focus()
}

/**
 * Toggles the panel; closing it returns the focus to the header button.
 * @returns {void}
 */
export const toggleAssistantPanel = (): void => {
  if (assistantPanelStore.getState().open) closeAssistantPanel()
  else assistantPanelStore.open()
}
