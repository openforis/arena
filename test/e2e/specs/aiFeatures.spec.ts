import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { FormDesigner } from '../helpers/formDesigner'
import { Urls } from '../helpers/urls'

// the server must run with the mock provider (see test/e2e/README.md)
const aiMock = process.env.E2E_AI_MOCK === 'true'

test.describe('AI features (mock provider)', () => {
  test.skip(!aiMock, 'needs a server started with AI_MOCK_PROVIDER_ENABLED=true and AI_DEFAULT_PROVIDER=mock')

  test.beforeEach(async ({ api }) => {
    await api.enableAiFeatures()
  })

  // the user is shared by the worker: leave it with AI off for the other specs
  test.afterEach(async ({ api }) => {
    await api.disableAiFeatures()
  })

  test.describe('unpublished survey without expressions', () => {
    test.use({ sampleSurveyOptions: { withExpressions: false, publish: false } })

    test('generates an expression and explains it', async ({ page, sampleSurvey: _ }) => {
      const { validations } = TestId.nodeDefDetails
      const designer = new FormDesigner(page)
      await designer.goto()
      await designer.gotoPage('plot')
      await designer.edit('tree_dec_1')
      await designer.gotoTab(validations)

      await page.getByTestId(TestId.expressionEditor.modeRadio(validations, 'defined')).click()
      await page.getByTestId(TestId.expressionEditor.aiGenerateBtn(validations)).click()
      const popup = page.locator('.ai-expression-popup')
      await popup.locator('textarea').fill('must be positive')
      await popup.getByRole('button', { name: 'Generate' }).click()
      await expect(popup).toContainText('tree_dec_1 > 0')
      await expect(popup).toContainText('MOCK: must be positive.')
      await popup.getByRole('button', { name: 'Use this expression' }).click()

      await expect(page.getByTestId(TestId.expressionEditor.query(validations))).toContainText('tree_dec_1 > 0')

      await page.getByTestId(TestId.expressionEditor.explainBtn(validations, 0)).click()
      // streamed through the gateway
      await expect(page.locator('.ai-explain-panel')).toContainText('MOCK')
    })
  })

  test('generates a Data Explorer query', async ({ page, sampleSurvey: _ }) => {
    await page.goto(Urls.dataExplorer)
    await page.getByRole('button', { name: 'Ask AI' }).click()
    const popup = page.locator('.ai-generate-query-popup')
    await popup.locator('textarea').fill('tree decimal values')
    await popup.getByRole('button', { name: 'Generate' }).click()
    await expect(page.getByText('MOCK query')).toBeVisible()
  })

  // the summarize button is shown only when the survey has activity log entries
  test('summarizes the activity log', async ({ page, sampleSurvey: _ }) => {
    await page.goto(Urls.dashboard)
    await page.getByText('Activity log', { exact: true }).click()
    await page.getByRole('button', { name: 'Summarize' }).click()
    await expect(page.getByText('MOCK activity summary.')).toBeVisible()
  })

  test('answers in the help chat', async ({ page }) => {
    await page.goto(Urls.home)
    await page.locator('.ai-chatbot-fab').click()
    const panel = page.locator('.ai-chatbot-panel')
    await panel.locator('textarea').fill('How do I add a table?')
    await panel.getByRole('button', { name: 'Send' }).click()
    await expect(panel).toContainText('MOCK')
  })

  test('hides the AI entry points when the user turns AI off', async ({ page, api }) => {
    await api.disableAiFeatures()
    await page.goto(Urls.home)
    await expect(page.locator('.ai-chatbot-fab')).toHaveCount(0)
  })
})
