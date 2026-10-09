import { expect, Page, Request } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import {
  assistantPanel,
  openAssistantPanel,
  selectAssistantArea,
  sendAssistantMessage,
  waitForAssistantTurn,
} from './assistantPanel'

export const analysisAreaLabel = 'Analysis'

export const analysisMessages = {
  propose: 'average of tree_dec_1 by cluster_id',
  run: 'run the average of tree_dec_1 by cluster_id',
}

// averages of tree_dec_1 by cluster in the sample records (test/e2e/fixtures/seed/sampleSurveyModel.ts)
export const expectedAverages = ['30.5', '31.5', '32.5']

/**
 * Collects the JSON bodies of the browser requests whose URL matches.
 * @param {Page} page - The page.
 * @param {(request: Request) => boolean} filter - Request filter.
 * @returns {object[]} The live list of bodies.
 */
export const collectRequestBodies = (page: Page, filter: (request: Request) => boolean): any[] => {
  const bodies: any[] = []
  page.on('request', (request) => {
    if (request.method() === 'POST' && filter(request)) bodies.push(request.postDataJSON())
  })
  return bodies
}

export const isGatewayRequest = (request: Request) => request.url().includes('/api/ai/model')

export const isExplorerQueryRequest = (request: Request) => /\/api\/surveyRdb\/\d+\/[^/]+\/query$/.test(request.url())

/**
 * Turns the local AI server on or off in C's browser settings.
 * @param {Page} page - The page.
 * @param {object} params - Parameters.
 * @param {string} params.userUuid - User uuid.
 * @param {boolean} params.enabled - Whether the local server is on.
 * @param {string} params.baseUrl - Stub base URL.
 * @param {string} params.modelId - Stub model id.
 * @returns {Promise<void>} Resolves when saved.
 */
export const setLocalServerSettings = async (
  page: Page,
  { userUuid, enabled, baseUrl, modelId }: { userUuid: string; enabled: boolean; baseUrl: string; modelId: string }
): Promise<void> => {
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, value),
    [`arena.ai.localServer.${userUuid}`, JSON.stringify({ enabled, baseUrl, modelId, preferLocal: true })]
  )
}

/**
 * Opens the assistant on the Analysis area and sends a message.
 * @param {Page} page - The page (on the Explorer).
 * @param {string} message - The message.
 * @returns {Promise<void>} Resolves when the message is sent.
 */
export const askAnalysis = async (page: Page, message: string): Promise<void> => {
  await openAssistantPanel(page)
  await selectAssistantArea(page, analysisAreaLabel)
  await sendAssistantMessage(page, message)
}

/**
 * Accepts C's first-use consent (shown once per user and survey), then waits for the end of the turn.
 * @param {Page} page - The page.
 * @returns {Promise<void>} Resolves when the turn has ended.
 */
export const acceptConsentAndWait = async (page: Page): Promise<void> => {
  await expect(page.getByTestId(TestId.ai.consentDialog)).toBeVisible()
  await page.getByTestId(TestId.ai.consentContinue).click()
  await waitForAssistantTurn(page)
}

/**
 * Reopens the most recent conversation of the current area from D1's History (after a reload).
 * @param {Page} page - The page.
 * @returns {Promise<void>} Resolves when the conversation is shown.
 */
export const reopenLastConversation = async (page: Page): Promise<void> => {
  const panel = assistantPanel(page)
  // the menu items render in a popover outside the panel
  await panel.getByTestId(TestId.aiAssistant.menuBtn).click()
  await page.getByTestId(TestId.aiAssistant.historyBtn).click()
  await expect(panel.getByTestId(TestId.aiAssistant.history)).toBeVisible()
  await panel.getByTestId(TestId.aiAssistant.historyItem).first().click()
}

/**
 * Returns the query card of the given query.
 * @param {Page} page - The page.
 * @param {string} queryId - Query id.
 * @returns {import('@playwright/test').Locator} The card.
 */
export const queryCard = (page: Page, queryId: string) => page.getByTestId(TestId.aiQueryCard.root(queryId))

/**
 * Checks that the Explorer table shows the expected averages.
 * @param {Page} page - The page.
 * @returns {Promise<void>} Resolves when visible.
 */
export const expectAveragesInTable = async (page: Page): Promise<void> => {
  const rows = page.locator('.data-query__container .table__rows')
  for (const value of expectedAverages) {
    await expect(rows).toContainText(value, { timeout: 30_000 })
  }
}
