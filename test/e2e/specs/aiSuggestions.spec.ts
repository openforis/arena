import type { Page } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import {
  assistantPanel,
  lastAssistantAnswer,
  openAssistantPanel,
  openSuggestionCard,
  selectAssistantArea,
  waitForAssistantTurn,
} from '../helpers/assistantPanel'
import { readSuggestionState, waitForSuggestionDetectors } from '../helpers/aiStorage'
import { FormDesigner } from '../helpers/formDesigner'
import { Urls } from '../helpers/urls'

// the server must run with the mock provider (see test/e2e/README.md)
const aiMock = process.env.E2E_AI_MOCK === 'true'

test.describe('Profile menu over the assistant panel (mock provider)', () => {
  test.skip(!aiMock, 'needs a server started with AI_MOCK_PROVIDER_ENABLED=true and AI_DEFAULT_PROVIDER=mock')

  test.beforeEach(async ({ api }) => {
    await api.enableAiFeatures()
  })

  // the worker user is shared with the other specs
  test.afterEach(async ({ api }) => {
    await api.disableAiFeatures()
  })

  test('the profile menu opens on top of the open panel and its link is clickable', async ({ page }) => {
    await page.goto(Urls.home)
    await openAssistantPanel(page)
    await page.getByTestId(TestId.header.userBtn).click()
    const profileLink = page.getByTestId(TestId.header.userProfileBtn)
    await expect(profileLink).toBeVisible()
    // behind the panel, the click would land on the panel (Playwright reports the element intercepting it)
    await profileLink.click()
    await expect(page).toHaveURL(/\/app\/users\/user\//)
  })
})

test.describe('Module introduction (mock provider)', () => {
  test.skip(!aiMock, 'needs a server started with AI_MOCK_PROVIDER_ENABLED=true and AI_DEFAULT_PROVIDER=mock')

  test.use({ sampleSurveyOptions: { withExpressions: false, publish: false } })

  test.beforeEach(async ({ api }) => {
    await api.enableAiFeatures()
  })

  test.afterEach(async ({ api }) => {
    await api.disableAiFeatures()
  })

  const helpTabDot = (page: Page) =>
    assistantPanel(page).getByTestId(TestId.aiAssistant.tab('help')).getByTestId(TestId.aiAssistant.tabDot)

  const cards = (page: Page) => assistantPanel(page).getByTestId(TestId.aiAssistant.suggestionCard)

  test('the first visit to the designer offers its introduction in Help; Do it asks the manual, then it is gone', async ({
    page,
    api,
    sampleSurvey: _,
  }) => {
    const userUuid = await api.getCurrentUserUuid()
    const designer = new FormDesigner(page)
    await designer.goto()

    // a dot on the button (no panel open), and the count in its accessible name
    await expect(page.getByTestId(TestId.aiAssistant.suggestionsDot)).toBeVisible()
    await expect(page.getByTestId(TestId.aiAssistant.openBtn)).toHaveAttribute(
      'aria-label',
      /^AI assistant: \d+ suggestions?$/
    )

    await openAssistantPanel(page)
    await expect(helpTabDot(page)).toBeVisible()
    await selectAssistantArea(page, 'Help')
    const card = cards(page).filter({ hasText: 'New to the form designer?' })
    await expect(card).toContainText('New to the form designer? Ask me how it works.')

    await openSuggestionCard(card)
    await card.getByTestId(TestId.aiAssistant.suggestionDoItBtn).click()
    // a new conversation showing the short request (the model gets the longer prompt), answered by the Help script of
    // the mock provider
    await expect(assistantPanel(page).getByTestId(TestId.aiAssistant.message('user')).last()).toContainText(
      'How does the form designer work?'
    )
    await waitForAssistantTurn(page)
    await expect(assistantPanel(page).getByTestId(TestId.aiAssistant.toolRow('docs_search'))).toContainText(
      'Searched the manual for "getting started"'
    )
    await expect(lastAssistantAnswer(page)).toContainText(
      'MOCK help: start with the steps of the cited manual section.'
    )

    // accepted: removed (not in progress) and the module is seen
    await expect(card).toHaveCount(0)
    await expect(helpTabDot(page)).toHaveCount(0)
    await expect.poll(async () => (await readSuggestionState(page, userUuid))?.seenModules ?? []).toContain('designer')

    // a later visit offers nothing
    await page.reload()
    await expect(designer.surveyForm).toBeVisible()
    await openAssistantPanel(page)
    await selectAssistantArea(page, 'Help')
    await expect(assistantPanel(page).getByTestId(TestId.aiAssistant.input)).toBeVisible()
    await expect(cards(page).filter({ hasText: 'New to the form designer?' })).toHaveCount(0)
  })

  test('with Proactive suggestions off there is no dot and no card', async ({ page, api, sampleSurvey: _ }) => {
    const userUuid = await api.getCurrentUserUuid()
    await page.goto(Urls.userProfile)
    await page.getByTestId(TestId.ai.accessCustomize).click()
    const toggle = page.getByTestId(TestId.ai.featureToggle('assistantSuggestions'))
    // on by default (enableAiFeatures turns every category on)
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await page.locator('button.btn-save').click()
    await expect.poll(async () => (await api.getAiSettings()).featureToggles?.assistantSuggestions).toBe(false)

    const designer = new FormDesigner(page)
    await designer.goto()
    await openAssistantPanel(page)
    await selectAssistantArea(page, 'Help')
    await expect(assistantPanel(page).getByTestId(TestId.aiAssistant.startScreen)).toBeVisible()
    // the same visit with the setting on shows the introduction card (see the test above): give the detectors their
    // chance to run before checking that nothing shows
    await waitForSuggestionDetectors(page)
    await expect(cards(page)).toHaveCount(0)
    await expect(page.getByTestId(TestId.aiAssistant.suggestionsDot)).toHaveCount(0)
    await expect(page.getByTestId(TestId.aiAssistant.openBtn)).toHaveAttribute('aria-label', 'AI assistant')
    // the checks did not run either: nothing was stored for Help
    expect((await readSuggestionState(page, userUuid))?.pending?.help ?? []).toEqual([])
  })
})
