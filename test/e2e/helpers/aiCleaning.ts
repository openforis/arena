import { expect, Page, Response } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { sampleRecords, SampleRecord } from '../fixtures/seed/sampleSurveyModel'
import type { ArenaApi } from '../fixtures/arenaApi'
import { setLocalServerSettings } from './aiAnalysis'
import { sendAssistantMessage } from './assistantPanel'
import { Urls } from './urls'

export const cleaningAreaLabel = 'Cleaning'

export const fixedValue = '25'

/**
 * Returns the first sample record with tree_dec_2 = 5 in its first tree (tree_dec_1 = 10.5):
 * the validation "tree_dec_2 > 10" fails on that node only.
 * @returns {SampleRecord} The record.
 */
export const buildInvalidTreeRecord = (): SampleRecord => {
  const [record] = sampleRecords
  const [firstTree, ...otherTrees] = record.trees
  return { ...record, trees: [{ ...firstTree, tree_dec_2: '5' }, ...otherTrees] }
}

/**
 * Returns the rows of the validation report.
 * @param {Page} page - The page.
 * @returns {import('@playwright/test').Locator} The rows.
 */
export const reportRows = (page: Page) =>
  page.getByTestId(TestId.table.rows(TestId.validationReport.validationReport)).locator('div.table__row')

/**
 * Opens the validation report and waits until it has the expected number of rows
 * (record validations are updated asynchronously, so the report is reloaded until then).
 * @param {Page} page - The page.
 * @param {number} count - Expected number of rows.
 * @returns {Promise<void>} Resolves when the report has that many rows.
 */
export const expectReportRowCount = async (page: Page, count: number): Promise<void> => {
  await expect
    .poll(
      async () => {
        const isReportResponse = (response: Response) =>
          new URL(response.url()).pathname.endsWith('/validationReport') && response.ok()
        await Promise.all([page.waitForResponse(isReportResponse), page.goto(Urls.validationReport)])
        await expect(page.getByTestId(TestId.table.noItems).or(reportRows(page).first())).toBeVisible()
        return reportRows(page).count()
      },
      { timeout: 30_000, intervals: [500, 1000, 2000] }
    )
    .toBe(count)
}

/**
 * Turns on C's local AI server settings for the logged-in user and reloads the page.
 * @param {Page} page - The page (already on an app URL).
 * @param {ArenaApi} api - The ArenaApi fixture of the same user (C's getCurrentUserUuid).
 * @param {{ baseUrl: string, modelId: string }} stub - C's stub server.
 * @returns {Promise<void>} Resolves after the reload.
 */
export const useLocalServer = async (
  page: Page,
  api: ArenaApi,
  stub: { baseUrl: string; modelId: string }
): Promise<void> => {
  const userUuid = await api.getCurrentUserUuid()
  await setLocalServerSettings(page, { userUuid, enabled: true, baseUrl: stub.baseUrl, modelId: stub.modelId })
  // wait for the app to boot: refresh tokens rotate, so a navigation that aborts the boot's refresh logs the user out
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes('/api/ai/settings') && response.request().method() === 'GET' && response.ok()
    ),
    page.reload(),
  ])
}

/**
 * Clicks "Ask the assistant" on the first report row, checks the pre-filled message and sends it.
 * @param {Page} page - The page (on the validation report).
 * @returns {Promise<void>} Resolves when the message is sent.
 */
export const askAssistantAboutFirstRow = async (page: Page): Promise<void> => {
  await reportRows(page).first().getByTestId(TestId.validationReport.askAssistantBtn).click()
  const composer = page.getByTestId(TestId.aiAssistant.input)
  // deviation 10: the row context is pre-filled, never sent by itself
  await expect(composer).toHaveValue(/\[cleaning-row-context\]/)
  await expect(page.getByTestId(TestId.aiCleaning.card)).toHaveCount(0)
  // nothing was sent yet
  await expect(page.getByTestId(TestId.aiAssistant.message('user'))).toHaveCount(0)
  await sendAssistantMessage(page, await composer.inputValue())
}

/**
 * Returns the record-edit card of the conversation (the last one).
 * @param {Page} page - The page.
 * @returns {import('@playwright/test').Locator} The card.
 */
export const recordEditCard = (page: Page) => page.getByTestId(TestId.aiCleaning.card).last()

/**
 * Applies the selected edits of the card and waits for the result of the first edit.
 * @param {Page} page - The page.
 * @param {string} status - Expected result status (applied, conflict, failed).
 * @returns {Promise<void>} Resolves when the result is shown.
 */
export const applyCardAndCheckStatus = async (page: Page, status: string): Promise<void> => {
  const card = recordEditCard(page)
  await card.getByTestId(TestId.aiCleaning.applyBtn).click()
  await expect(card.getByTestId(TestId.aiCleaning.result).first()).toHaveAttribute('data-value', status, {
    timeout: 30_000,
  })
}
