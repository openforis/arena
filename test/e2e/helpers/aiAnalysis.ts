import { expect, Page, Request } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import type { ArenaApi } from '../fixtures/arenaApi'

import { writeLocalProviders } from './aiStorage'
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

// the id of the local provider the e2e specs write in the browser
export const E2E_LOCAL_PROVIDER_ID = 'local:e2e'

/**
 * Makes the stub server the only local provider of this browser and the default provider, or removes it and makes
 * Arena default the default again. The page must be on an app URL; reload it afterwards with `reloadApp` (the
 * capabilities are read when the app loads).
 * @param {Page} page - The page.
 * @param {ArenaApi} api - The ArenaApi fixture of the same user.
 * @param {object} params - Parameters.
 * @param {boolean} params.enabled - Add (true) or remove (false) the local provider.
 * @param {string} params.baseUrl - Stub base URL.
 * @param {string} params.modelId - Stub model id.
 * @param {string} [params.name] - Provider name.
 * @returns {Promise<void>} Resolves when saved.
 */
export const setLocalProvider = async (
  page: Page,
  api: ArenaApi,
  {
    enabled,
    baseUrl,
    modelId,
    name = 'Local server',
  }: { enabled: boolean; baseUrl: string; modelId: string; name?: string }
): Promise<void> => {
  const userUuid = await api.getCurrentUserUuid()
  const providers = enabled ? [{ id: E2E_LOCAL_PROVIDER_ID, name, baseUrl, modelId }] : []
  await writeLocalProviders(page, userUuid, providers)
  await api.setAiDefaultProvider(enabled ? E2E_LOCAL_PROVIDER_ID : 'arena-default')
}

/**
 * Reloads the app and waits until it has booted (the AI settings are loaded). Refresh tokens rotate, so a navigation
 * that aborts the boot's refresh logs the user out: use this after `setLocalProvider` and for any other reload in the
 * AI specs, never a bare `page.reload()` or a second `goto`.
 * @param {Page} page - The page.
 * @returns {Promise<void>} Resolves when the app has booted.
 */
export const reloadApp = async (page: Page): Promise<void> => {
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes('/api/ai/settings') && response.request().method() === 'GET' && response.ok()
    ),
    page.reload(),
  ])
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
 * Accepts the first-use consent (shown once per user and survey), then waits for the end of the turn.
 * @param {Page} page - The page.
 * @returns {Promise<void>} Resolves when the turn has ended.
 */
export const acceptConsentAndWait = async (page: Page): Promise<void> => {
  await expect(page.getByTestId(TestId.ai.consentDialog)).toBeVisible()
  await page.getByTestId(TestId.ai.consentContinue).click()
  await waitForAssistantTurn(page)
}

/**
 * Reopens the most recent conversation of the current area (after a reload) from the home page (back from the
 * conversation when one is already open).
 * @param {Page} page - The page.
 * @returns {Promise<void>} Resolves when the conversation is shown.
 */
export const reopenLastConversation = async (page: Page): Promise<void> => {
  const panel = assistantPanel(page)
  const bar = panel.getByTestId(TestId.aiAssistant.conversationBar)
  if (await bar.isVisible()) await bar.getByTestId(TestId.aiAssistant.conversationBackBtn).click()
  await panel.getByTestId(TestId.aiAssistant.recentItem).first().click()
  await expect(bar).toBeVisible()
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
