import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'

test.describe('Survey delete', () => {
  test('deletes the current survey from the dashboard', async ({ page, survey, api }) => {
    await page.goto('/app/dashboard/')
    await expect(page.getByTestId(TestId.dashboard.surveyName)).toHaveText(survey.name)

    await page.getByTestId(TestId.dashboard.advancedFunctionsBtn).click()
    await page.getByTestId(TestId.dashboard.surveyDeleteBtn).click()

    const modal = page.getByTestId(TestId.modal.modal)
    await expect(modal).toBeVisible()
    await page.getByTestId(TestId.dialogConfirm.strongConfirmInput).fill(survey.name)
    await modal.getByRole('button', { name: 'Delete', exact: true }).click()

    await expect(page.getByText(`Survey ${survey.name} has been deleted`)).toBeVisible()
    await expect(page).toHaveURL(/\/app\/home\/surveys\/$/)
    expect(await api.findSurveyIdByName({ name: survey.name })).toBeNull()
  })
})
