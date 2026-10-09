import { expect, Locator, Page } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

/**
 * Returns the assistant panel.
 * @param {Page} page - Page.
 * @returns {Locator} The panel (a dialog, hidden while closed).
 */
export const assistantPanel = (page: Page): Locator => page.getByTestId(TestId.aiAssistant.panel)

/**
 * Opens the assistant panel from the header button (no-op when open).
 * @param {Page} page - Page.
 * @returns {Promise<void>} - Resolves when the panel is visible.
 */
export const openAssistantPanel = async (page: Page): Promise<void> => {
  const panel = assistantPanel(page)
  if (await panel.isVisible()) return
  await page.getByTestId(TestId.aiAssistant.openBtn).click()
  await expect(panel).toBeVisible()
}

/**
 * Closes the assistant panel.
 * @param {Page} page - Page.
 * @returns {Promise<void>} - Resolves when the panel is hidden.
 */
export const closeAssistantPanel = async (page: Page): Promise<void> => {
  await assistantPanel(page).getByTestId(TestId.aiAssistant.closeBtn).click()
  await expect(assistantPanel(page)).toBeHidden()
}

/**
 * Selects an area tab by its label ("Design", "Help").
 * @param {Page} page - Page.
 * @param {string} label - Tab label (en).
 * @returns {Promise<void>} - Resolves when the tab is selected.
 */
export const selectAssistantArea = async (page: Page, label: string): Promise<void> => {
  const tab = assistantPanel(page).getByRole('tab', { name: label, exact: true })
  await tab.click()
  await expect(tab).toHaveAttribute('aria-selected', 'true')
}

/**
 * Sends a message; resolves when it is shown (the answer is still running).
 * @param {Page} page - Page.
 * @param {string} text - Message.
 * @returns {Promise<void>} - Resolves when the message is in the conversation.
 */
export const sendAssistantMessage = async (page: Page, text: string): Promise<void> => {
  const panel = assistantPanel(page)
  const userMessages = panel.getByTestId(TestId.aiAssistant.message('user'))
  const before = await userMessages.count()
  await panel.getByTestId(TestId.aiAssistant.input).fill(text)
  await panel.getByTestId(TestId.aiAssistant.sendBtn).click()
  await expect(userMessages).toHaveCount(before + 1)
}

/**
 * Waits for the end of the running answer.
 * @param {Page} page - Page.
 * @returns {Promise<void>} - Resolves when the answer is done, stopped or failed.
 */
export const waitForAssistantTurn = async (page: Page): Promise<void> => {
  const panel = assistantPanel(page)
  await expect(panel).toHaveAttribute('data-busy', 'false', { timeout: 30_000 })
  await expect(lastAssistantAnswer(page)).not.toHaveAttribute('data-status', 'streaming')
}

/**
 * Returns the last answer of the conversation.
 * @param {Page} page - Page.
 * @returns {Locator} The answer.
 */
export const lastAssistantAnswer = (page: Page): Locator =>
  assistantPanel(page).getByTestId(TestId.aiAssistant.message('assistant')).last()
