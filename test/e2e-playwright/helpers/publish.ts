import { expect, Page } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { Urls } from './urls'

/**
 * Waits for the job shown in the job monitor to end (the job progress bar has the job status as class name).
 * @param {Page} page - The page.
 * @returns {Promise<string>} - The final job status ('succeeded' or 'failed').
 */
export const waitForJobEnd = async (page: Page): Promise<string> => {
  const progress = page.locator('.app-job-monitor .progress-bar-with-label').first()
  await expect(progress).toHaveClass(/succeeded|failed|canceled/, { timeout: 60_000 })
  const className = (await progress.getAttribute('class')) ?? ''
  return ['succeeded', 'failed', 'canceled'].find((status) => className.includes(status))!
}

const jobErrorsText = async (page: Page): Promise<string> =>
  `job errors: ${await page.locator('.app-job-monitor').innerText()}`

const startPublish = async (page: Page) => {
  await page.getByTestId(TestId.header.surveyPublishBtn).click()
  await page.getByTestId(TestId.modal.modal).getByRole('button', { name: 'Ok' }).click()
}

/**
 * Publishes the current survey and checks that the publish job completes successfully.
 * @param {Page} page - The page.
 * @returns {Promise<void>} - Resolves when the survey has been published.
 */
export const publishSurvey = async (page: Page): Promise<void> => {
  await startPublish(page)
  await expect(await waitForJobEnd(page), await jobErrorsText(page)).toBe('succeeded')
  await page.getByTestId(TestId.modal.modal).getByRole('button', { name: 'Close' }).click()

  await page.goto(Urls.dashboard)
  await expect(page.getByTestId(TestId.dashboard.surveyStatus)).toHaveText(/^\(published\)$/i)
}

/**
 * Tries to publish the current survey and checks that the publish job fails with the specified errors.
 * @param {Page} page - The page.
 * @param {string[]} errors - Expected error messages.
 * @returns {Promise<void>} - Resolves when the errors have been checked and the job dialog closed.
 */
export const publishSurveyWithErrors = async (page: Page, errors: string[]): Promise<void> => {
  await startPublish(page)
  const jobModal = page.getByTestId(TestId.modal.modal)
  await expect(jobModal.locator('.app-job-monitor__job-errors').first()).toBeAttached({ timeout: 30_000 })
  // errors are listed (expanded) in the details of the failed inner job
  for (const error of errors) {
    await expect(jobModal.getByText(error).filter({ visible: true }).first()).toBeVisible()
  }
  await page.getByTestId(TestId.modal.modal).getByRole('button', { name: 'Close' }).click()
}
