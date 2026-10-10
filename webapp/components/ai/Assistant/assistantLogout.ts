/**
 * What logout does to the assistant: stop the running answers, wait for their saves, reset the panel.
 * The conversations stay in this browser until the user clears them (user decision, 2026-10-10); every read filters
 * by the user's uuid, so another user of the same browser doesn't see them.
 */
import { assistantPanelStore } from './assistantPanelStore'
import { abortAssistantTurns, settleAssistantSaves } from './assistantTurnRegistry'

export type AssistantLogoutDeps = {
  abortTurns: () => void
  settleSaves: () => Promise<void>
  resetPanel: () => void
}

/**
 * Creates the logout step of the assistant.
 * @param {AssistantLogoutDeps} deps - Turn registry and panel actions.
 * @returns {Function} Resolves when the panel is reset.
 */
export const createAssistantLogout =
  ({ abortTurns, settleSaves, resetPanel }: AssistantLogoutDeps) =>
  async (): Promise<void> => {
    // the answers stop and their saves end before the reset, so nothing writes into the next session's panel
    abortTurns()
    await settleSaves()
    resetPanel()
  }

export const resetAssistantOnLogout: () => Promise<void> = createAssistantLogout({
  abortTurns: abortAssistantTurns,
  settleSaves: settleAssistantSaves,
  resetPanel: () => assistantPanelStore.reset(),
})
