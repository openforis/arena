import { expect, Page } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { Urls } from './urls'

/**
 * Deletes the current survey (or template) from the dashboard, confirming the deletion with its name.
 * @param {Page} page - The page.
 * @param {string} surveyName - Name of the current survey.
 * @returns {Promise<void>} - Resolves when the survey has been deleted.
 */
export const deleteCurrentSurvey = async (page: Page, surveyName: string): Promise<void> => {
  await page.goto(Urls.dashboard)
  await expect(page.getByTestId(TestId.dashboard.surveyName)).toHaveText(surveyName)

  await page.getByTestId(TestId.dashboard.advancedFunctionsBtn).click()
  await page.getByTestId(TestId.dashboard.surveyDeleteBtn).click()

  const modal = page.getByTestId(TestId.modal.modal)
  await page.getByTestId(TestId.dialogConfirm.strongConfirmInput).fill(surveyName)
  await modal.getByRole('button', { name: 'Delete', exact: true }).click()

  // deleting a survey drops its DB schemas: it can take a while
  await expect(page.getByText(`Survey ${surveyName} has been deleted`)).toBeVisible({ timeout: 30_000 })
}
