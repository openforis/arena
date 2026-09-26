import { Page } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { expect, generateSurveyName, test } from '../fixtures'
import { deleteCurrentSurvey } from '../helpers/dashboard'
import { getDropdown, selectDropdownItem } from '../helpers/dropdown'
import { publishSurvey } from '../helpers/publish'
import {
  exportSurvey,
  verifySampleCategories,
  verifySampleNodeDefs,
  verifySampleRecords,
  verifySampleTaxonomies,
  verifySurveyInfo,
} from '../helpers/surveyExport'
import { Urls } from '../helpers/urls'

const fillSurveyCreateForm = async (page: Page, { name, label }: { name: string; label?: string }) => {
  await page.locator(`input[data-testid="${TestId.surveyCreate.surveyName}"]`).fill(name)
  if (label) await page.locator(`input[data-testid="${TestId.surveyCreate.surveyLabel}"]`).fill(label)
}

const selectCloneFrom = async (page: Page, { name, label }: { name: string; label: string }) =>
  selectDropdownItem({
    page,
    dropdown: getDropdown(page, TestId.surveyCreate.surveyCloneFrom),
    label: `${name} - ${label}`,
  })

const expectCurrentSurvey = async (page: Page, { name, label }: { name: string; label: string }) =>
  expect(page.getByTestId(TestId.header.surveyTitle)).toHaveText(`${label} [${name}]`, { timeout: 30_000 })

test.describe('Templates', () => {
  // names of the surveys/templates created through the UI, deleted after each test
  let createdNames: { name: string; template: boolean }[] = []

  test.beforeEach(() => {
    createdNames = []
  })

  test.afterEach(async ({ api }) => {
    for (const { name, template } of createdNames) {
      await api.deleteSurveyByNameIfExists({ name, template })
    }
  })

  test('creates a new template', async ({ page }, testInfo) => {
    const template = { name: generateSurveyName(testInfo.parallelIndex), label: 'My Template' }
    createdNames.push({ name: template.name, template: true })

    await page.goto(Urls.templateNew)
    await fillSurveyCreateForm(page, template)
    await page.getByTestId(TestId.surveyCreate.submitBtn).click()
    await expectCurrentSurvey(page, template)

    await page.goto(Urls.templateList)
    await expect(page.getByTestId(template.name)).toBeVisible()
  })

  test('creates a template cloning a survey', async ({ page, sampleSurvey }, testInfo) => {
    const template = { name: generateSurveyName(testInfo.parallelIndex), label: sampleSurvey.label }
    createdNames.push({ name: template.name, template: true })

    await page.goto(Urls.templateNew)
    await fillSurveyCreateForm(page, template)
    await page.getByTestId(TestId.surveyCreate.createTypeBtn({ prefix: 'templateCreateType', type: 'clone' })).click()
    await page
      .locator('.clone-from-type_btn-group .radio-button-group-item')
      .getByText('Survey', { exact: true })
      .click()
    await selectCloneFrom(page, sampleSurvey)
    await page.getByTestId(TestId.surveyCreate.submitBtn).click()
    await expectCurrentSurvey(page, template)

    const templateExport = await exportSurvey(page, testInfo, { withData: false })
    verifySurveyInfo(templateExport, { name: template.name })
    expect(templateExport.survey.template).toBe(true)
    verifySampleNodeDefs(templateExport)
    verifySampleCategories(templateExport)
    verifySampleTaxonomies(templateExport)
  })

  test.describe('with an existing template', () => {
    test.use({ sampleSurveyOptions: { template: true, publish: false } })

    test('publishes the template', async ({ page, sampleSurvey: _ }) => {
      await page.goto(Urls.dashboard)
      await publishSurvey(page)
    })

    test('deletes the template', async ({ page, sampleSurvey: template }) => {
      await page.goto(Urls.templateList)
      await expect(page.getByTestId(template.name)).toBeVisible()

      await deleteCurrentSurvey(page, template.name)

      await expect(page).toHaveURL(/\/app\/home\/templates\/$/)
      await expect(page.getByTestId(template.name)).toHaveCount(0)
    })
  })

  test.describe('with a published template', () => {
    test.use({ sampleSurveyOptions: { template: true, publish: true } })

    test('creates a survey from the template', async ({ page, sampleSurvey: template }, testInfo) => {
      const survey = { name: generateSurveyName(testInfo.parallelIndex), label: template.label }
      createdNames.push({ name: survey.name, template: false })

      await page.goto(Urls.surveyNew)
      await fillSurveyCreateForm(page, survey)
      await page.getByTestId(TestId.surveyCreate.createTypeBtn({ prefix: 'surveyCreateType', type: 'clone' })).click()
      await selectCloneFrom(page, template)
      await page.getByTestId(TestId.surveyCreate.submitBtn).click()
      await expectCurrentSurvey(page, survey)

      const surveyExport = await exportSurvey(page, testInfo)
      verifySurveyInfo(surveyExport, { name: survey.name })
      expect(surveyExport.survey.template).toBe(false)
      verifySampleNodeDefs(surveyExport)
      verifySampleCategories(surveyExport)
      verifySampleTaxonomies(surveyExport)
      verifySampleRecords(surveyExport, [])
    })
  })
})
