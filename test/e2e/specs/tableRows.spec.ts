import { Page } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { category, cluster, sampleRecords } from '../fixtures/seed/sampleSurveyModel'
import { Urls } from '../helpers/urls'

const categoriesUrl = '/app/designer/categories/'

const recordKeyCell = (page: Page, clusterId: string) =>
  page.locator(
    `[data-testid="${TestId.records.cellNodeDef(cluster.children.cluster_id.name)}"][data-value="${clusterId}"]`
  )

const recordRow = (page: Page, clusterId: string) =>
  page.locator('.table__row', { has: recordKeyCell(page, clusterId) })

const categoryRow = (page: Page) => page.locator('.table__row', { hasText: category.name })

test.describe('Table rows', () => {
  test.describe('with selection (records)', () => {
    test.use({ sampleSurveyOptions: { records: sampleRecords } })

    test('a click selects the row, a double click opens it', async ({ page, sampleSurvey: _ }) => {
      const { cluster_id: clusterId } = sampleRecords[0]
      await page.goto(Urls.records)

      await recordKeyCell(page, clusterId).click()
      await expect(recordRow(page, clusterId)).toHaveClass(/selected/)
      await expect(page.getByText('1 item selected')).toBeVisible()

      await recordKeyCell(page, clusterId).click()
      await expect(recordRow(page, clusterId)).not.toHaveClass(/selected/)

      await recordKeyCell(page, clusterId).dblclick()
      await expect(page.getByTestId(TestId.surveyForm.surveyForm)).toBeVisible()
    })

    test('the buttons in a row do not select it', async ({ page, sampleSurvey: _ }) => {
      await page.goto(Urls.records)
      await page.getByTestId(TestId.records.tableRowDeleteButton(0)).click()
      await page.getByTestId(TestId.modal.modal).getByRole('button', { name: 'Cancel' }).click()
      await expect(page.locator('.table__row.selected')).toHaveCount(0)
    })

    test('Space selects the focused row, Enter opens it', async ({ page, sampleSurvey: _ }) => {
      const { cluster_id: clusterId } = sampleRecords[0]
      await page.goto(Urls.records)

      await recordRow(page, clusterId).focus()
      await page.keyboard.press('Space')
      await expect(recordRow(page, clusterId)).toHaveClass(/selected/)

      await page.keyboard.press('Enter')
      await expect(page.getByTestId(TestId.surveyForm.surveyForm)).toBeVisible()
    })
  })

  test.describe('without selection (categories)', () => {
    test('a click opens the item', async ({ page, sampleSurvey: _ }) => {
      await page.goto(categoriesUrl)
      await categoryRow(page).getByText(category.name, { exact: true }).click()
      await expect(page).toHaveURL(/\/designer\/category\//)
    })

    test('Enter opens the focused row', async ({ page, sampleSurvey: _ }) => {
      await page.goto(categoriesUrl)
      await categoryRow(page).focus()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/\/designer\/category\//)
    })

    test('the buttons in a row do their own action only', async ({ page, sampleSurvey: _ }) => {
      await page.goto(categoriesUrl)
      // the category is used by a code attribute: delete shows a notification instead of deleting it
      await categoryRow(page).getByRole('button', { name: 'Delete' }).click()
      await expect(page.getByText('This category is used by some node definitions', { exact: false })).toBeVisible()
      await expect(page).toHaveURL(/\/designer\/categories\/$/)
    })
  })
})
