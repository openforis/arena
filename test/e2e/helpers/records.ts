import { expect, Page } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { Urls } from './urls'

/**
 * Opens the record with the specified root key (cluster_id) from the records list
 * (the first one, if more records have the same key).
 * @param {Page} page - The page.
 * @param {string} clusterId - Value of the record key attribute.
 * @param {object} [options] - Options.
 * @param {boolean} [options.unlock] - Whether to unlock the record for editing.
 * @returns {Promise<void>} - Resolves when the record editor is ready.
 */
export const openRecord = async (page: Page, clusterId: string, { unlock = false } = {}): Promise<void> => {
  await page.goto(Urls.records)
  await page
    .locator(`[data-testid="${TestId.records.cellNodeDef('cluster_id')}"][data-value="${clusterId}"]`)
    .first()
    .dblclick()
  await expect(page.getByTestId(TestId.surveyForm.surveyForm)).toBeVisible()
  if (unlock) await unlockRecord(page)
}

/**
 * Unlocks the record currently open in the record editor for editing (if it is locked).
 * @param {Page} page - The page.
 * @returns {Promise<void>} - Resolves when the record is editable.
 */
export const unlockRecord = async (page: Page): Promise<void> => {
  const lockToggle = page.getByTestId(TestId.record.editLockToggleBtn)
  await expect(lockToggle).toBeVisible()
  if (/unlock/i.test((await lockToggle.textContent()) ?? '')) {
    await lockToggle.click()
  }
  await expect(lockToggle).not.toHaveText(/unlock/i)
}
