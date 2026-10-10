import type { Page } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import type { TestUser } from '../fixtures/testUsers'
import { acceptConsentAndWait, setLocalServerSettings } from '../helpers/aiAnalysis'
import {
  assistantPanel,
  closeAssistantPanel,
  lastAssistantAnswer,
  openAssistantPanel,
  selectAssistantArea,
  sendAssistantMessage,
  waitForAssistantTurn,
} from '../helpers/assistantPanel'
import { FormDesigner } from '../helpers/formDesigner'
import { Urls } from '../helpers/urls'
import {
  type LocalModelServerStub,
  STUB_CONTEXT_TOKENS,
  STUB_CONTEXT_USED_TOKENS,
  startLocalModelServer,
} from '../stubs/localModelServer'

// the server must run with the mock provider (see test/e2e/README.md)
const aiMock = process.env.E2E_AI_MOCK === 'true'

// matches the design script /label/i of server/modules/ai/service/mockScripts.ts
const LABEL_REQUEST = 'Change the label of cluster_id to Cluster identifier'

const userMessages = (page: Page) => assistantPanel(page).getByTestId(TestId.aiAssistant.message('user'))

/**
 * Logs out from the header menu, then in again (the web app gets its token from the refresh cookie on the next load).
 * @param {Page} page - The page.
 * @param {object} params - Parameters.
 * @param {string} params.baseURL - Arena base URL.
 * @param {TestUser} params.user - The worker user.
 * @returns {Promise<void>} Resolves when logged in again (no page loaded yet).
 */
const logOutAndBackIn = async (page: Page, { baseURL, user }: { baseURL: string; user: TestUser }): Promise<void> => {
  await page.getByTestId(TestId.header.userBtn).click()
  await page.getByTestId(TestId.header.userLogoutBtn).click()
  await expect(page.locator('button.btn.login')).toBeVisible()
  const response = await page.context().request.post(`${baseURL}/auth/login`, {
    data: { email: user.email, password: user.password },
  })
  expect(response.ok(), `login of ${user.email} failed`).toBeTruthy()
}

/**
 * Formats a token count as the meter does in English.
 * @param {number} tokens - Tokens.
 * @returns {string} For example 1.5K.
 */
const compact = (tokens: number): string =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(tokens)

/**
 * Navigates inside the app, as a user reaches a page from the sidebar (no reload: a running answer goes on).
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

const countChatRequests = (stub: LocalModelServerStub): number =>
  stub.requests.filter((request) => request.path === '/v1/chat/completions').length

test.describe('AI assistant (mock provider)', () => {
  test.skip(!aiMock, 'needs a server started with AI_MOCK_PROVIDER_ENABLED=true and AI_DEFAULT_PROVIDER=mock')

  test.use({ sampleSurveyOptions: { withExpressions: false, publish: false } })

  test.beforeEach(async ({ api }) => {
    await api.enableAiFeatures()
  })

  // the worker user is shared with the other specs
  test.afterEach(async ({ api }) => {
    await api.disableAiFeatures()
  })

  // Design must be selected on its own: no tab is clicked
  const expectDesignSelected = async (page: Page): Promise<void> => {
    await expect(assistantPanel(page).getByRole('tab', { name: 'Design', exact: true })).toHaveAttribute(
      'aria-selected',
      'true'
    )
  }

  const openDesignArea = async (page: Page, { fromHome = false } = {}): Promise<FormDesigner> => {
    const designer = new FormDesigner(page)
    if (fromHome) {
      // the panel opens on Help on the home page; reaching the designer must then select Design
      await page.goto(Urls.home)
      await openAssistantPanel(page)
      await expect(assistantPanel(page).getByRole('tab', { name: 'Help', exact: true })).toHaveAttribute(
        'aria-selected',
        'true'
      )
      await closeAssistantPanel(page)
      await navigateInApp(page, Urls.formDesigner)
      await expect(designer.surveyForm).toBeVisible()
    } else {
      await designer.goto()
    }
    await openAssistantPanel(page)
    await expectDesignSelected(page)
    return designer
  }

  const proposeLabel = async (page: Page): Promise<void> => {
    await sendAssistantMessage(page, LABEL_REQUEST)
    await waitForAssistantTurn(page)
    const panel = assistantPanel(page)
    await expect(panel.getByTestId(TestId.aiAssistant.toolRow('nodeDef_get'))).toContainText('Looked up cluster_id')
    await expect(panel.getByTestId(TestId.aiAssistant.changeSetRow('cluster_id'))).toContainText('Cluster identifier')
    await expect(lastAssistantAnswer(page)).toContainText('MOCK: I proposed a new label for')
  }

  test('proposes a label, applied on Apply selected', async ({ page, sampleSurvey: _ }) => {
    const designer = await openDesignArea(page, { fromHome: true })
    await proposeLabel(page)
    const panel = assistantPanel(page)
    // the mock provider reports no usage: the meter shows an estimate
    await expect(panel.getByTestId(TestId.aiAssistant.contextMeter)).toContainText('≈')
    await panel.getByTestId(TestId.aiAssistant.applyBtn).click()
    await expect(panel.getByTestId(TestId.aiAssistant.changeSetRowStatus).first()).toHaveText('Applied')
    await expect(designer.surveyForm.getByText('Cluster identifier', { exact: true }).first()).toBeVisible()

    // saved on the server, not only in the page
    await page.reload()
    await expect(designer.surveyForm.getByText('Cluster identifier', { exact: true }).first()).toBeVisible()
  })

  test('proposes a new attribute, created on Apply selected', async ({ page, sampleSurvey: _ }) => {
    const designer = await openDesignArea(page)
    await sendAssistantMessage(page, 'Add a remarks field to the cluster')
    await waitForAssistantTurn(page)
    const panel = assistantPanel(page)
    await expect(panel.getByTestId(TestId.aiAssistant.changeSetRow('cluster_remarks')).first()).toContainText(
      'New text'
    )
    await panel.getByTestId(TestId.aiAssistant.applyBtn).click()
    await expect(panel.getByTestId(TestId.aiAssistant.changeSetRowStatus).first()).toHaveText('Applied')
    await expect(designer.nodeDefWrapper('cluster_remarks')).toBeVisible()

    await page.reload()
    await expect(designer.nodeDefWrapper('cluster_remarks')).toBeVisible()
  })

  test('answers from the user manual in the Help area', async ({ page }) => {
    await page.goto(Urls.home)
    await openAssistantPanel(page)
    await selectAssistantArea(page, 'Help')
    await sendAssistantMessage(page, 'How do I publish a survey?')
    await waitForAssistantTurn(page)
    await expect(assistantPanel(page).getByTestId(TestId.aiAssistant.toolRow('docs_search'))).toContainText(
      'Searched the manual for "publish survey"'
    )
    await expect(lastAssistantAnswer(page)).toContainText('MOCK help: publish the survey from the survey list')
  })

  test('a label changed after the proposal is a disabled conflict, never overwritten', async ({
    page,
    sampleSurvey: _,
  }) => {
    const designer = await openDesignArea(page)
    await proposeLabel(page)
    await closeAssistantPanel(page)

    await designer.edit('cluster_id')
    await designer.fillDetails({ name: 'cluster_id', label: 'Cluster code' })
    await designer.saveAndBack('Cluster code')

    await openAssistantPanel(page)
    const panel = assistantPanel(page)
    await expect(panel.getByTestId(TestId.aiAssistant.stale)).toBeVisible()
    // the conflicting row is unchecked and disabled: nothing is left to apply
    const checkbox = panel.getByTestId(TestId.aiAssistant.changeSetRow('cluster_id')).getByRole('checkbox')
    await expect(checkbox).toBeDisabled()
    await expect(checkbox).not.toBeChecked()
    await expect(panel.getByTestId(TestId.aiAssistant.applyBtn)).toBeDisabled()
    await expect(designer.surveyForm.getByText('Cluster code', { exact: true }).first()).toBeVisible()
  })

  test('conversations are listed in the history and survive a reload', async ({ page, sampleSurvey: _ }) => {
    await openDesignArea(page)
    await proposeLabel(page)
    const panel = assistantPanel(page)

    // the menu items render in a popover outside the panel
    await panel.getByTestId(TestId.aiAssistant.menuBtn).click()
    await page.getByTestId(TestId.aiAssistant.newConversationBtn).click()
    await expect(panel.getByTestId(TestId.aiAssistant.message('user'))).toHaveCount(0)

    const openHistory = async () => {
      await panel.getByTestId(TestId.aiAssistant.menuBtn).click()
      await page.getByTestId(TestId.aiAssistant.historyBtn).click()
      await expect(panel.getByTestId(TestId.aiAssistant.history)).toBeVisible()
    }
    await openHistory()
    const item = panel.getByTestId(TestId.aiAssistant.historyItem)
    await expect(item).toHaveCount(1)
    await expect(item).toContainText(LABEL_REQUEST)
    await item.click()
    await expect(panel.getByTestId(TestId.aiAssistant.changeSetCard)).toBeVisible()

    await page.reload()
    await openAssistantPanel(page)
    await expectDesignSelected(page)
    await openHistory()
    await expect(panel.getByTestId(TestId.aiAssistant.historyItem)).toHaveCount(1)
  })

  test('each area keeps its conversation across area switches, reloads and logout', async ({
    page,
    baseURL,
    testUser,
    sampleSurvey: _,
  }) => {
    const designer = await openDesignArea(page)
    await proposeLabel(page)

    await selectAssistantArea(page, 'Help')
    await expect(userMessages(page)).toHaveCount(0)
    await selectAssistantArea(page, 'Design')
    await expect(userMessages(page)).toHaveCount(1)
    await expect(lastAssistantAnswer(page)).toContainText('MOCK: I proposed a new label for')

    await page.reload()
    await openAssistantPanel(page)
    await expectDesignSelected(page)
    await expect(userMessages(page)).toHaveCount(1)
    await expect(assistantPanel(page).getByTestId(TestId.aiAssistant.changeSetCard)).toBeVisible()

    await closeAssistantPanel(page)
    await logOutAndBackIn(page, { baseURL: baseURL!, user: testUser })
    await designer.goto()
    await openAssistantPanel(page)
    await expectDesignSelected(page)
    await expect(userMessages(page)).toHaveCount(1)
    await expect(lastAssistantAnswer(page)).toContainText('MOCK: I proposed a new label for')
  })

  test('New conversation empties only the current area; the history says where conversations are kept', async ({
    page,
    sampleSurvey: _,
  }) => {
    await openDesignArea(page)
    await proposeLabel(page)
    await selectAssistantArea(page, 'Help')
    await sendAssistantMessage(page, 'How do I publish a survey?')
    await waitForAssistantTurn(page)
    await expect(lastAssistantAnswer(page)).toContainText('MOCK help: publish the survey from the survey list')

    const panel = assistantPanel(page)
    // the menu items render in a popover outside the panel
    await panel.getByTestId(TestId.aiAssistant.menuBtn).click()
    await page.getByTestId(TestId.aiAssistant.newConversationBtn).click()
    await expect(userMessages(page)).toHaveCount(0)

    await selectAssistantArea(page, 'Design')
    await expect(userMessages(page)).toHaveCount(1)
    await selectAssistantArea(page, 'Help')
    await expect(userMessages(page)).toHaveCount(0)

    await panel.getByTestId(TestId.aiAssistant.menuBtn).click()
    await page.getByTestId(TestId.aiAssistant.historyBtn).click()
    await expect(panel.getByTestId(TestId.aiAssistant.historyKept)).toHaveText(
      'The latest 30 conversations of each survey are kept in this browser until you clear them.'
    )
  })

  test('each survey keeps its own conversation while the panel stays open', async ({ page, sampleSurvey, survey }) => {
    // client-side navigation and clicks only: the panel stays mounted and open
    const activateSurvey = async (name: string): Promise<void> => {
      await navigateInApp(page, Urls.surveyList)
      await page.getByTestId(name).click()
      await expect(page.getByTestId(name)).toBeVisible()
    }
    await page.goto(Urls.surveyList)
    await page.getByTestId(sampleSurvey.name).click()
    await openAssistantPanel(page)
    await selectAssistantArea(page, 'Help')
    await sendAssistantMessage(page, 'How do I publish a survey?')
    await waitForAssistantTurn(page)
    await expect(lastAssistantAnswer(page)).toContainText('MOCK help: publish the survey from the survey list')

    await activateSurvey(survey.name)
    await expect(assistantPanel(page)).toBeVisible()
    await expect(userMessages(page)).toHaveCount(0)

    await activateSurvey(sampleSurvey.name)
    await expect(assistantPanel(page)).toBeVisible()
    await expect(userMessages(page)).toHaveCount(1)
    await expect(userMessages(page)).toContainText('How do I publish a survey?')
    await expect(lastAssistantAnswer(page)).toContainText('MOCK help: publish the survey from the survey list')
  })

  test('the Design area shows why it is unavailable when the survey AI policy refuses', async ({
    page,
    api,
    sampleSurvey,
  }) => {
    await api.putSurveyAiPolicy(sampleSurvey.id, { schema: 'off', data: 'off' })
    const designer = new FormDesigner(page)
    await designer.goto()
    await openAssistantPanel(page)
    await selectAssistantArea(page, 'Design')
    const panel = assistantPanel(page)
    await expect(panel.getByTestId(TestId.aiAssistant.unavailable)).not.toBeEmpty()
    await expect(panel.getByTestId(TestId.aiAssistant.input)).toHaveCount(0)
  })
})

test.describe('AI assistant context meter (stub local server)', () => {
  test.skip(!aiMock, 'needs a server started with AI_MOCK_PROVIDER_ENABLED=true and AI_DEFAULT_PROVIDER=mock')

  test.use({ sampleSurveyOptions: { withExpressions: false, publish: false } })

  let stub: LocalModelServerStub | null = null

  test.beforeEach(async ({ api }) => {
    await api.enableAiFeatures()
    stub = await startLocalModelServer()
  })

  test.afterEach(async ({ api }) => {
    await stub?.stop()
    stub = null
    await api.disableAiFeatures()
  })

  test('after an answer the meter shows the reported usage against the context size', async ({
    page,
    api,
    sampleSurvey: _,
  }) => {
    const designer = new FormDesigner(page)
    await designer.goto()
    const userUuid = await api.getCurrentUserUuid()
    await setLocalServerSettings(page, { userUuid, enabled: true, baseUrl: stub!.baseUrl, modelId: stub!.modelId })
    await designer.goto()
    await openAssistantPanel(page)
    await expect(assistantPanel(page).getByTestId(TestId.aiAssistant.contextMeter)).toHaveCount(0)

    await sendAssistantMessage(page, LABEL_REQUEST)
    await acceptConsentAndWait(page)

    const meter = assistantPanel(page).getByTestId(TestId.aiAssistant.contextMeter)
    await expect(meter).toContainText(`${compact(STUB_CONTEXT_USED_TOKENS)} / ${compact(STUB_CONTEXT_TOKENS)} tokens`)
    await expect(meter).not.toContainText('≈')
    await expect(meter).not.toContainText('(assumed)')
    const bar = meter.getByRole('meter')
    await expect(bar).toHaveAttribute('aria-valuenow', String(STUB_CONTEXT_USED_TOKENS))
    await expect(bar).toHaveAttribute('aria-valuemax', String(STUB_CONTEXT_TOKENS))
    expect(stub!.requests.some((request) => request.path === '/v1/chat/completions')).toBe(true)

    // a reload shows the stored usage again: the meter needs no new answer (the status probes of the server are fine)
    const chatRequestsBefore = countChatRequests(stub!)
    await page.reload()
    await openAssistantPanel(page)
    await expect(meter).toContainText(`${compact(STUB_CONTEXT_USED_TOKENS)} / ${compact(STUB_CONTEXT_TOKENS)} tokens`)
    await expect(bar).toHaveAttribute('aria-valuenow', String(STUB_CONTEXT_USED_TOKENS))
    await expect(bar).toHaveAttribute('aria-valuemax', String(STUB_CONTEXT_TOKENS))
    expect(countChatRequests(stub!)).toBe(chatRequestsBefore)
  })

  // a route change is the real way the area changes during an answer (the tabs are disabled while busy); the window
  // before the first save is pinned by unit test 118 (decideLoadedConversation)
  test('leaving the designer and coming back while an answer streams keeps the conversation and its answer', async ({
    page,
    api,
    sampleSurvey: _,
  }) => {
    const designer = new FormDesigner(page)
    await designer.goto()
    const userUuid = await api.getCurrentUserUuid()
    await setLocalServerSettings(page, { userUuid, enabled: true, baseUrl: stub!.baseUrl, modelId: stub!.modelId })
    await designer.goto()
    await openAssistantPanel(page)
    // the first-use consent is asked once per user, survey and feature: take it with a quick turn, then start over
    await sendAssistantMessage(page, LABEL_REQUEST)
    await acceptConsentAndWait(page)
    await assistantPanel(page).getByTestId(TestId.aiAssistant.menuBtn).click()
    await page.getByTestId(TestId.aiAssistant.newConversationBtn).click()
    await expect(userMessages(page)).toHaveCount(0)

    stub!.setChunkDelay(1000)
    await sendAssistantMessage(page, LABEL_REQUEST)
    await expect(assistantPanel(page)).toHaveAttribute('data-busy', 'true')

    // closed, the panel follows the route: Help away from the designer (the answer goes on in the background)
    await closeAssistantPanel(page)
    await navigateInApp(page, Urls.home)
    await openAssistantPanel(page)
    await expect(assistantPanel(page).getByRole('tab', { name: 'Help', exact: true })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await expect(userMessages(page)).toHaveCount(0)
    await closeAssistantPanel(page)

    await navigateInApp(page, Urls.formDesigner)
    await expect(designer.surveyForm).toBeVisible()
    await openAssistantPanel(page)
    await expect(assistantPanel(page).getByRole('tab', { name: 'Design', exact: true })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await expect(userMessages(page)).toHaveCount(1)
    await expect(userMessages(page)).toContainText(LABEL_REQUEST)
    await waitForAssistantTurn(page)
    await expect(lastAssistantAnswer(page)).toContainText('MOCK: I proposed a new label for')
    await expect(assistantPanel(page).getByTestId(TestId.aiAssistant.changeSetCard)).toBeVisible()
  })
})
