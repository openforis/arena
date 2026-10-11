import type { Page } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import type { ArenaApi } from '../fixtures/arenaApi'
import {
  assistantPanel,
  closeAssistantPanel,
  lastAssistantAnswer,
  openAssistantPanel,
  selectAssistantArea,
  waitForAssistantTurn,
} from '../helpers/assistantPanel'
import { FormDesigner } from '../helpers/formDesigner'
import { Urls } from '../helpers/urls'

// the server must run with the mock provider (see test/e2e/README.md)
const aiMock = process.env.E2E_AI_MOCK === 'true'

// the sample survey has 19 node definitions, each with an English label and no description
const TRANSLATIONS_CARD = '19 texts are missing in French. Translate them?'

/**
 * Marks the module introductions as seen before the app loads, so only this spec's cards show (spec §4.9).
 * @param {Page} page - The page.
 * @param {ArenaApi} api - API of the worker user.
 * @returns {Promise<void>} Resolves when the init script is registered.
 */
const skipModuleIntros = async (page: Page, api: ArenaApi): Promise<void> => {
  const key = `arena.ai.suggestions.${await api.getCurrentUserUuid()}`
  await page.addInitScript((storageKey) => {
    if (window.localStorage.getItem(storageKey) === null) {
      const state = { pending: {}, dismissed: {}, inProgress: {}, seenModules: ['designer', 'data', 'analysis'] }
      window.localStorage.setItem(storageKey, JSON.stringify(state))
    }
  }, key)
}

/**
 * Adds French to the survey languages in Survey Info and saves.
 * @param {Page} page - The page.
 * @returns {Promise<void>} Resolves when the server saved the survey info.
 */
const addFrench = async (page: Page): Promise<void> => {
  await page.goto(Urls.surveyInfo)
  const languageInput = page.locator(`input[data-testid="${TestId.surveyInfo.surveyLanguage}"]`)
  await expect(languageInput).toBeVisible()
  await languageInput.fill('fr')
  await page.getByTestId(TestId.dropdown.dropDownItem('fr')).click()
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' && /\/api\/survey\/\d+\/info/.test(response.url()) && response.ok()
    ),
    page.getByTestId(TestId.surveyInfo.saveBtn).click(),
  ])
}

/**
 * Navigates inside the app, as a user reaches a page from the sidebar (no reload).
 * @param {Page} page - The page.
 * @param {string} uri - Route to go to.
 * @returns {Promise<void>} Resolves when the route is pushed.
 */
const navigateInApp = async (page: Page, uri: string): Promise<void> => {
  await page.evaluate((target) => {
    window.history.pushState({}, '', target)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, uri)
}

const suggestionCards = (page: Page, text: string) =>
  assistantPanel(page).getByTestId(TestId.aiAssistant.suggestionCard).filter({ hasText: text })

test.describe('AI assistant Design suggestions (mock provider)', () => {
  test.skip(!aiMock, 'needs a server started with AI_MOCK_PROVIDER_ENABLED=true and AI_DEFAULT_PROVIDER=mock')

  test.use({ sampleSurveyOptions: { withExpressions: false, publish: false } })

  test.beforeEach(async ({ api, page }) => {
    await api.enableAiFeatures()
    await skipModuleIntros(page, api)
  })

  // the worker user is shared with the other specs
  test.afterEach(async ({ api }) => {
    await api.disableAiFeatures()
  })

  test('a new language offers the translations; Do it proposes them and Apply clears the card', async ({
    page,
    sampleSurvey: _,
  }) => {
    await addFrench(page)
    const designer = new FormDesigner(page)
    await designer.goto()
    await expect(page.getByTestId(TestId.aiAssistant.suggestionsDot)).toBeVisible()

    await openAssistantPanel(page)
    const panel = assistantPanel(page)
    await expect(panel.getByRole('tab', { name: 'Design', exact: true })).toHaveAttribute('aria-selected', 'true')
    const card = suggestionCards(page, 'missing in French')
    await expect(card).toContainText(TRANSLATIONS_CARD)

    await card.getByTestId(TestId.aiAssistant.suggestionDoItBtn).click()
    await expect(panel.getByTestId(TestId.aiAssistant.message('user'))).toHaveCount(1)
    await waitForAssistantTurn(page)
    await expect(panel.getByTestId(TestId.aiAssistant.toolRow('survey_listMissingTexts'))).toContainText(
      'Listed the missing texts'
    )
    await expect(panel.getByTestId(TestId.aiAssistant.changeSetRow('cluster_id'))).toContainText('Cluster id (fr)')

    await panel.getByTestId(TestId.aiAssistant.applyBtn).click()
    await expect(panel.getByTestId(TestId.aiAssistant.changeSetRowStatus).first()).toHaveText('Applied')
    // the state detector runs 1 s after the survey changes and finds nothing left to translate
    await expect(suggestionCards(page, 'missing in French')).toHaveCount(0, { timeout: 10000 })
  })

  test('a dismissed card stays gone after a reload and returns for a new text', async ({ page, sampleSurvey: _ }) => {
    await addFrench(page)
    const designer = new FormDesigner(page)
    await designer.goto()
    await openAssistantPanel(page)
    const card = suggestionCards(page, 'missing in French')
    await expect(card).toContainText(TRANSLATIONS_CARD)
    await card.getByTestId(TestId.aiAssistant.suggestionDismissBtn).click()
    await expect(suggestionCards(page, 'missing in French')).toHaveCount(0)

    await closeAssistantPanel(page)
    await page.reload()
    await expect(designer.surveyForm).toBeVisible()
    await openAssistantPanel(page)
    await expect(suggestionCards(page, 'missing in French')).toHaveCount(0)
    await closeAssistantPanel(page)

    await designer.addChildWithDetails('cluster', 'text', { name: 'cluster_extra', label: 'Cluster extra' })
    await openAssistantPanel(page)
    await expect(suggestionCards(page, 'missing in French')).toContainText('1 text is missing in French. Translate it?')
  })

  test('entries added in the designer get the descriptions card, scoped to them', async ({ page, sampleSurvey: _ }) => {
    const designer = new FormDesigner(page)
    await designer.goto()
    await designer.addChildWithDetails('cluster', 'text', { name: 'cluster_note_a', label: 'Note A' })
    await designer.addChildWithDetails('cluster', 'text', { name: 'cluster_note_b', label: 'Note B' })

    // leaving the designer fires designerLeft
    await navigateInApp(page, Urls.home)
    await openAssistantPanel(page)
    await selectAssistantArea(page, 'Design')
    const card = suggestionCards(page, 'without a description')
    await expect(card).toContainText('You added 2 entries without a description. Write descriptions in all languages?')

    await card.getByTestId(TestId.aiAssistant.suggestionDoItBtn).click()
    await waitForAssistantTurn(page)
    // the mock names what survey_listMissingTexts returned: only the two new entries (the suggestion scope)
    await expect(lastAssistantAnswer(page)).toContainText(
      'MOCK: 2 entries without a description: cluster_note_a, cluster_note_b.'
    )
  })
})
