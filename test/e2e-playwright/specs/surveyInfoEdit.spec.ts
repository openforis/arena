import { Page } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'

const surveyInfoForm = (page: Page) => ({
  name: page.locator(`input[data-testid="${TestId.surveyInfo.surveyName}"]`),
  label: page.locator(`input[data-testid="${TestId.surveyInfo.surveyLabel()}"]`),
  description: page.locator(`textarea[data-testid="${TestId.surveyInfo.surveyDescription()}"]`),
  languageInput: page.locator(`input[data-testid="${TestId.surveyInfo.surveyLanguage}"]`),
  saveBtn: page.getByTestId(TestId.surveyInfo.saveBtn),
})

test.describe('Survey info edit', () => {
  test.beforeEach(async ({ page, survey }) => {
    await page.goto('/app/home/surveyInfo/')
    await expect(surveyInfoForm(page).name).toHaveValue(survey.name)
  })

  test('requires the survey name', async ({ page }) => {
    const form = surveyInfoForm(page)
    await form.name.fill('')
    await form.saveBtn.click()

    await form.name.hover()
    await expect(page.getByText('Name is required')).toBeVisible()
  })

  test('saves name, label, description and languages', async ({ page, survey }) => {
    const form = surveyInfoForm(page)
    const newName = `${survey.name}_ed`

    await form.name.fill(newName)
    await form.label.fill('My Survey')
    await form.description.fill('This is a survey description')
    await form.languageInput.fill('fr')
    await page.getByTestId(TestId.dropdown.dropDownItem('fr')).click()
    await form.saveBtn.click()

    await expect(page.getByTestId(TestId.header.surveyTitle)).toHaveText(`My Survey [${newName}]`)

    await page.reload()

    await expect(form.name).toHaveValue(newName)
    await expect(form.label).toHaveValue('My Survey')
    await expect(form.description).toHaveValue('This is a survey description')
    await expect(page.getByRole('button', { name: 'English', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'French', exact: true })).toBeVisible()
  })
})
