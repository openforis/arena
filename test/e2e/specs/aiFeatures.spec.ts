import type { Page } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { expect, generateSurveyName, test } from '../fixtures'
import { FormDesigner } from '../helpers/formDesigner'
import { Urls } from '../helpers/urls'
import { getWorkerSurveyEditor, insertSurveyEditor } from '../fixtures/testUsers'

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

test.describe('Survey AI policy (mock provider)', () => {
  test.skip(!aiMock, 'needs a server started with AI_MOCK_PROVIDER_ENABLED=true and AI_DEFAULT_PROVIDER=mock')

  test.beforeEach(async ({ api }) => {
    await api.enableAiFeatures()
  })

  // the user is shared by the worker: leave it with AI off for the other specs
  test.afterEach(async ({ api }) => {
    await api.disableAiFeatures()
  })

  const openActivitySection = async (page: Page) => {
    await page.goto(Urls.dashboard)
    await page.getByTestId(TestId.dashboard.activityToggle).click()
  }

  // the survey needs a root entity to show the dashboard sections, and activity log entries to show Summarize
  test('the activity log summary is blocked on a new survey', async ({ page, sampleSurvey: _ }) => {
    await openActivitySection(page)
    await expect(page.locator('.btn-ai-summary')).toBeDisabled()
    await page.getByTestId(TestId.ai.policyBlocked).hover()
    await expect(page.getByTestId(TestId.ai.policyBlockedTooltip)).toContainText(
      "This survey's AI policy keeps record data on this device."
    )
  })

  test('the survey admin allows record data in the cloud, then the summary works', async ({
    page,
    sampleSurvey: _,
  }) => {
    await page.goto(Urls.surveyInfo)
    await page.getByTestId(TestId.tabBar.tabBarBtn('aiPolicy')).click()
    await page.getByTestId(`${TestId.surveyInfo.aiPolicy.levelGroup('data')}_cloud`).click()
    await expect(page.getByText('AI policy saved')).toBeVisible()

    await openActivitySection(page)
    await page.locator('.btn-ai-summary').click()
    await expect(page.getByText('MOCK activity summary.')).toBeVisible()
  })

  test.describe('with the sample survey', () => {
    test.use({ sampleSurveyOptions: { withExpressions: false, publish: false } })

    test('survey design Off disables the expression AI', async ({ page, api, sampleSurvey }) => {
      // the survey is deleted at the end of the test: no need to restore the policy
      await api.putSurveyAiPolicy(sampleSurvey.id, { schema: 'off', data: 'onDevice' })
      const { validations } = TestId.nodeDefDetails
      const designer = new FormDesigner(page)
      await designer.goto()
      await designer.gotoPage('plot')
      await designer.edit('tree_dec_1')
      await designer.gotoTab(validations)

      await page.getByTestId(TestId.expressionEditor.modeRadio(validations, 'defined')).click()
      await expect(page.getByTestId(TestId.expressionEditor.aiGenerateBtn(validations))).toBeDisabled()
    })
  })

  test('a survey editor who is not an administrator sees the tab read-only', async ({
    browser,
    baseURL,
    survey,
  }, testInfo) => {
    const editor = getWorkerSurveyEditor(testInfo.parallelIndex)
    await insertSurveyEditor({ user: editor, surveyId: survey.id })

    const context = await browser.newContext({ baseURL })
    try {
      await context.route(/google-analytics\.com|googletagmanager\.com/, (route) => route.abort())
      const login = await context.request.post('/auth/login', {
        data: { email: editor.email, password: editor.password },
      })
      expect(login.ok(), `login of ${editor.email} failed`).toBeTruthy()
      const page = await context.newPage()
      await page.goto(Urls.surveyInfo)
      await page.getByTestId(TestId.tabBar.tabBarBtn('aiPolicy')).click()
      await expect(page.getByTestId(TestId.surveyInfo.aiPolicy.readOnlyNote)).toBeVisible()
      await expect(page.getByTestId(`${TestId.surveyInfo.aiPolicy.levelGroup('data')}_cloud`)).toBeDisabled()
    } finally {
      await context.close()
    }
  })
})

// API only: runs without the mock provider too (the policy API works whether or not AI is enabled)
test.describe('Survey AI policy (API)', () => {
  test('the policy survives a survey clone', async ({ api, survey }, testInfo) => {
    await api.putSurveyAiPolicy(survey.id, { schema: 'off', data: 'cloud' })
    const name = generateSurveyName(testInfo.parallelIndex)
    const cloneId = await api.cloneSurvey({ cloneFrom: survey.id, name, label: `Clone ${name}` })
    try {
      const { policy } = await api.getSurveyAiPolicy(cloneId)
      expect(policy).toEqual({ schema: 'off', data: 'cloud' })
    } finally {
      await api.deleteSurveyIfExists(cloneId)
    }
  })
})
