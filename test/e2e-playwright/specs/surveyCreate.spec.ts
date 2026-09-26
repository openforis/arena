import { TestId } from '@webapp/utils/testId'

import { expect, generateSurveyName, test } from '../fixtures'

test.describe('Survey create', () => {
  let surveyName: string

  test.beforeEach(async ({}, testInfo) => {
    surveyName = generateSurveyName(testInfo.parallelIndex)
  })

  test.afterEach(async ({ api }) => {
    const surveyId = await api.findSurveyIdByName({ name: surveyName })
    if (surveyId) await api.deleteSurveyIfExists(surveyId)
  })

  test('creates a new survey from scratch', async ({ page }) => {
    const label = 'My E2E Survey'

    await page.goto('/app/home/')
    await page.getByTestId(TestId.header.userBtn).click()
    await page.getByTestId(TestId.header.surveyCreateBtn).click()
    await expect(page).toHaveURL(/\/app\/home\/surveyNew\/$/)

    await page.locator(`input[data-testid="${TestId.surveyCreate.surveyName}"]`).fill(surveyName)
    await page.locator(`input[data-testid="${TestId.surveyCreate.surveyLabel}"]`).fill(label)
    await page.getByTestId(TestId.surveyCreate.submitBtn).click()

    // survey creation runs as a job; the app navigates to the new survey when it completes
    await expect(page.getByTestId(TestId.header.surveyTitle)).toHaveText(`${label} [${surveyName}]`, {
      timeout: 30_000,
    })
  })

  test('shows a validation error when the name is missing', async ({ page }) => {
    await page.goto('/app/home/surveyNew/')

    await page.locator(`input[data-testid="${TestId.surveyCreate.surveyLabel}"]`).fill('Survey without name')
    await page.getByTestId(TestId.surveyCreate.submitBtn).click()

    await expect(page).toHaveURL(/\/app\/home\/surveyNew\/$/)
    await expect(page.getByTestId(TestId.header.surveyTitle)).toHaveCount(0)
  })
})
