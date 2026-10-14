import type { Page } from '@playwright/test'

import { FileFormats } from '@core/fileFormats'
import { parseCsvAsync } from '@test/utils/csvUtils'
import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { cluster } from '../fixtures/seed/sampleSurveyModel'
import { Urls } from '../helpers/urls'

// the server must run with the mock provider (see test/e2e/README.md)
const aiMock = process.env.E2E_AI_MOCK === 'true'

/**
 * Waits for a gateway call of the feature (the batch runs in the browser, through POST /api/ai/model).
 * @param {Page} page - Page.
 * @param {string} feature - Feature key.
 * @returns {Promise<object>} The request.
 */
const waitForGatewayCall = (page: Page, feature: string) =>
  page.waitForRequest(
    (request) => request.url().endsWith('/api/ai/model') && request.postDataJSON()?.feature === feature
  )

/**
 * Opens the Form Designer's advanced menu.
 * @param {Page} page - Page.
 * @returns {Promise<void>} Resolves when the menu is open.
 */
const openAdvancedMenu = async (page: Page) => {
  await page.goto(Urls.formDesigner)
  await expect(page.getByTestId(TestId.surveyForm.surveyForm)).toBeVisible()
  await page.getByTestId(TestId.surveyForm.advancedFunctionBtn).click()
}

test.describe('AI batches run in the browser (mock provider)', () => {
  test.skip(!aiMock, 'needs a server started with AI_MOCK_PROVIDER_ENABLED=true and AI_DEFAULT_PROVIDER=mock')

  test.beforeEach(async ({ api }) => {
    await api.enableAiFeatures()
  })

  // the user is shared by the worker: leave it with AI off for the other specs
  test.afterEach(async ({ api }) => {
    await api.disableAiFeatures()
  })

  test.describe('survey in two languages', () => {
    test.use({ sampleSurveyOptions: { withExpressions: false, publish: false, languages: ['en', 'fr'] } })

    test('AI: Translate labels runs in the browser and opens the review', async ({ page, sampleSurvey: _ }) => {
      await openAdvancedMenu(page)
      const translationCall = waitForGatewayCall(page, 'translation')
      await page.getByTestId(TestId.surveyForm.aiTranslateLabelsBtn).click()
      await translationCall

      const modal = page.locator('.node-defs-translation-modal')
      await expect(modal).toBeVisible({ timeout: 30_000 })
      await expect(modal).toContainText('Translate Node Definition Labels')
      await expect(modal).toContainText(cluster.label)
      // the mock translates every text into every language: the suggestion shows and nothing is reported as failed
      await expect(modal).toContainText('MOCK fr')
      await expect(page.getByTestId(TestId.ai.translationFailedNotice)).toHaveCount(0)
    })
  })

  test.describe('survey in one language', () => {
    test.use({ sampleSurveyOptions: { withExpressions: false, publish: false } })

    test('the schema summary with AI descriptions is described in the browser', async ({
      page,
      sampleSurvey: _,
    }, testInfo) => {
      await openAdvancedMenu(page)
      const dataDictionaryCall = waitForGatewayCall(page, 'dataDictionary')
      await page.getByTestId(TestId.surveyForm.schemaSummaryAi(FileFormats.csv)).click()
      await dataDictionaryCall

      const downloadBtn = page.getByTestId(TestId.surveyForm.schemaSummaryAiDownloadBtn)
      await expect(downloadBtn).toBeVisible({ timeout: 30_000 })
      await expect(page.locator('.schema-summary-export__warning')).toHaveCount(0)
      const [download] = await Promise.all([page.waitForEvent('download'), downloadBtn.click()])
      const filePath = testInfo.outputPath('schemaSummaryAi.csv')
      await download.saveAs(filePath)

      const rows = (await parseCsvAsync(filePath)) as Record<string, string>[]
      expect(Object.keys(rows[0])).toContain('aiDescription')
      // the root is never described; the sample survey has no descriptions, so every other row is
      expect(rows.find((row) => row.name === cluster.name)!.aiDescription).toBe('')
      for (const row of rows.filter((candidate) => candidate.name !== cluster.name)) {
        expect([row.name, row.aiDescription]).toEqual([row.name, 'MOCK description.'])
      }
    })
  })
})
