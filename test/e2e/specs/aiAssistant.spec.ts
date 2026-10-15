import type { Page } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import type { TestUser } from '../fixtures/testUsers'
import { acceptConsentAndWait, setLocalProvider } from '../helpers/aiAnalysis'
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

// long enough to be cut by the provider chip
const LONG_LOCAL_NAME = 'Local server on the workstation in the field office'

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
    // the mock provider reports no usage: the ring shows an estimate (its tokens are in the label and the tooltip)
    await expect(panel.getByTestId(TestId.aiAssistant.contextMeter)).toHaveAttribute('aria-label', /≈/)
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

  test('+ opens a blank chat; back shows the home page with the recent conversations and no message box', async ({
    page,
    sampleSurvey: _,
  }) => {
    await openDesignArea(page)
    await proposeLabel(page)
    const panel = assistantPanel(page)
    const bar = panel.getByTestId(TestId.aiAssistant.conversationBar)
    const home = panel.getByTestId(TestId.aiAssistant.startScreen)
    await expect(bar).toContainText(LABEL_REQUEST)

    // + : a blank chat, neither suggestions nor recent conversations
    await panel.getByTestId(TestId.aiAssistant.newConversationBtn).click()
    await expect(home).toHaveCount(0)
    await expect(bar).toContainText('New conversation')
    await expect(userMessages(page)).toHaveCount(0)
    await expect(panel.getByTestId(TestId.aiAssistant.input)).toBeVisible()

    // back: the home page, with a New conversation button instead of the message box
    await bar.getByTestId(TestId.aiAssistant.conversationBackBtn).click()
    await expect(home).toBeVisible()
    await expect(bar).toHaveCount(0)
    await expect(panel.getByTestId(TestId.aiAssistant.input)).toHaveCount(0)
    await expect(home.getByTestId(TestId.aiAssistant.homeNewConversationBtn)).toBeVisible()
    const recent = panel.getByTestId(TestId.aiAssistant.recentItem)
    await expect(recent).toHaveCount(1)
    await expect(recent).toContainText(LABEL_REQUEST)
    // a long title never pushes the row (and its time) past the panel
    const panelBox = await panel.boundingBox()
    const rowBox = await recent.boundingBox()
    expect(rowBox!.x + rowBox!.width).toBeLessThanOrEqual(panelBox!.x + panelBox!.width)
    await recent.click()
    await expect(panel.getByTestId(TestId.aiAssistant.changeSetCard)).toBeVisible()

    // a reload shows the remembered conversation, never the start screen (not even for a moment)
    await page.addInitScript(() => {
      const w = window as unknown as { __startScreenSeen: boolean }
      w.__startScreenSeen = false
      const check = () => {
        if (document.querySelector('[data-testid="ai-assistant-start-screen"]')) w.__startScreenSeen = true
      }
      new MutationObserver(check).observe(document, { childList: true, subtree: true })
    })
    await page.reload()
    await openAssistantPanel(page)
    await expectDesignSelected(page)
    await expect(panel.getByTestId(TestId.aiAssistant.conversationBar)).toContainText(LABEL_REQUEST)
    await expect(panel.getByTestId(TestId.aiAssistant.startScreen)).toHaveCount(0)
    expect(await page.evaluate(() => (window as unknown as { __startScreenSeen: boolean }).__startScreenSeen)).toBe(
      false
    )

    // the full list, from the home page; its back goes home too
    await bar.getByTestId(TestId.aiAssistant.conversationBackBtn).click()
    await panel.getByTestId(TestId.aiAssistant.seeAllBtn).click()
    await expect(panel.getByTestId(TestId.aiAssistant.history)).toBeVisible()
    await expect(panel.getByTestId(TestId.aiAssistant.historyItem)).toHaveCount(1)
    await panel.getByTestId(TestId.aiAssistant.historyBackBtn).click()
    await expect(home).toBeVisible()
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
    await panel.getByTestId(TestId.aiAssistant.newConversationBtn).click()
    await expect(userMessages(page)).toHaveCount(0)

    await selectAssistantArea(page, 'Design')
    await expect(userMessages(page)).toHaveCount(1)
    await selectAssistantArea(page, 'Help')
    await expect(userMessages(page)).toHaveCount(0)

    // the Help area has one conversation: the home page lists it, the list says where conversations are kept
    await expect(panel.getByTestId(TestId.aiAssistant.recentItem)).toHaveCount(1)
    await panel.getByTestId(TestId.aiAssistant.seeAllBtn).click()
    await expect(panel.getByTestId(TestId.aiAssistant.historyKept)).toHaveText(
      'The latest 30 conversations of each survey are kept in this browser until you delete them.'
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

  test('the list searches titles and deletes rows, staying on the list', async ({ page, sampleSurvey: _ }) => {
    await openDesignArea(page)
    await proposeLabel(page)
    const panel = assistantPanel(page)
    await panel.getByTestId(TestId.aiAssistant.newConversationBtn).click()
    await sendAssistantMessage(page, 'Add a text attribute notes to cluster')
    await waitForAssistantTurn(page)

    await panel.getByTestId(TestId.aiAssistant.conversationBackBtn).click()
    await panel.getByTestId(TestId.aiAssistant.seeAllBtn).click()
    const rows = panel.getByTestId(TestId.aiAssistant.historyItem)
    await expect(rows).toHaveCount(2)

    const search = panel.getByTestId(TestId.aiAssistant.historySearch)
    await search.fill('CLUSTER_ID')
    await expect(rows).toHaveCount(1)
    await expect(rows).toContainText(LABEL_REQUEST)
    await search.fill('no such title')
    await expect(rows).toHaveCount(0)
    await expect(panel).toContainText('No conversation matches.')
    await search.fill('')

    const notesRow = panel.locator('li', {
      has: page.getByTestId(TestId.aiAssistant.historyItem).filter({ hasText: 'notes' }),
    })
    await notesRow.hover()
    await notesRow.getByTestId(TestId.aiAssistant.historyDeleteBtn).click()
    await page.getByTestId(TestId.modal.modal).getByRole('button', { name: 'Ok' }).click()
    await expect(rows).toHaveCount(1)
    await expect(rows).toContainText(LABEL_REQUEST)
    await expect(panel.getByTestId(TestId.aiAssistant.history)).toBeVisible()

    await panel.getByTestId(TestId.aiAssistant.historyBackBtn).click()
    await expect(panel.getByTestId(TestId.aiAssistant.startScreen)).toBeVisible()
    await expect(panel.getByTestId(TestId.aiAssistant.recentItem)).toHaveCount(1)
  })

  test('Delete all asks first; Cancel keeps the conversations, Ok deletes them', async ({ page, sampleSurvey: _ }) => {
    await openDesignArea(page)
    await proposeLabel(page)
    const panel = assistantPanel(page)
    const modal = page.getByTestId(TestId.modal.modal)

    await panel.getByTestId(TestId.aiAssistant.menuBtn).click()
    await page.getByTestId(TestId.aiAssistant.deleteAllBtn).click()
    await expect(modal).toContainText('in every survey and every area')
    await modal.getByRole('button', { name: 'Cancel' }).click()
    await expect(panel.getByTestId(TestId.aiAssistant.conversationBar)).toBeVisible()

    await panel.getByTestId(TestId.aiAssistant.menuBtn).click()
    await page.getByTestId(TestId.aiAssistant.deleteAllBtn).click()
    await modal.getByRole('button', { name: 'Ok' }).click()
    await expect(panel.getByTestId(TestId.aiAssistant.startScreen)).toBeVisible()
    await expect(panel.getByTestId(TestId.aiAssistant.recentItem)).toHaveCount(0)
  })

  test('AI settings opens the user profile', async ({ page, sampleSurvey: _ }) => {
    await openDesignArea(page)
    await assistantPanel(page).getByTestId(TestId.aiAssistant.menuBtn).click()
    await page.getByTestId(TestId.aiAssistant.aiSettingsBtn).click()
    await expect(page).toHaveURL(new RegExp(`${Urls.userProfile}$`))
  })

  test('the footer shows the provider, what is sent and the context used, aligned', async ({
    page,
    sampleSurvey: _,
  }) => {
    await openDesignArea(page)
    const panel = assistantPanel(page)
    // the composer (and its footer) is in the chat, not on the home page
    await panel.getByTestId(TestId.aiAssistant.homeNewConversationBtn).click()
    const footer = panel.getByTestId(TestId.aiAssistant.composerFooter)
    const chip = footer.getByTestId(TestId.aiAssistant.providerChip)
    await expect(chip).toHaveAttribute('title', /^Arena default/)
    await expect(chip.locator('.icon-cloud')).toBeVisible()
    await expect(footer.getByTestId(TestId.aiAssistant.sentDataChip)).toHaveAttribute('data-level', 'schema')
    await expect(footer.getByTestId(TestId.aiAssistant.sentDataChip)).toHaveAttribute(
      'aria-label',
      'Data sent: Survey design'
    )
    await expect(footer.getByTestId(TestId.aiAssistant.contextMeter)).toHaveCount(0)

    await proposeLabel(page)
    const ring = footer.getByTestId(TestId.aiAssistant.contextMeter)
    await expect(ring).toBeVisible()

    // every item is centred on the footer's middle line (TooltipNew's inline wrapper must not shift them)
    // and Send stays inside the footer
    const box = (await footer.boundingBox())!
    const middle = box.y + box.height / 2
    for (const item of [chip, ring, footer.getByTestId(TestId.aiAssistant.sentDataChip)]) {
      const itemBox = (await item.boundingBox())!
      expect(Math.abs(itemBox.y + itemBox.height / 2 - middle)).toBeLessThan(2)
    }
    const send = (await footer.getByTestId(TestId.aiAssistant.sendBtn).boundingBox())!
    expect(send.x + send.width).toBeLessThanOrEqual(box.x + box.width)

    await selectAssistantArea(page, 'Help')
    await panel.getByTestId(TestId.aiAssistant.homeNewConversationBtn).click()
    await expect(footer.getByTestId(TestId.aiAssistant.sentDataChip)).toHaveAttribute('data-level', 'questions')
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

  test('with a local provider the chip shows the laptop icon, the name in its tooltip, and Send stays inside', async ({
    page,
    api,
    sampleSurvey: _,
  }) => {
    const designer = new FormDesigner(page)
    await designer.goto()
    await setLocalProvider(page, api, {
      enabled: true,
      baseUrl: stub!.baseUrl,
      modelId: stub!.modelId,
      name: LONG_LOCAL_NAME,
    })
    await designer.goto()
    await openAssistantPanel(page)
    // all footer items shown: the ring needs a finished answer
    await sendAssistantMessage(page, LABEL_REQUEST)
    await acceptConsentAndWait(page)

    const footer = assistantPanel(page).getByTestId(TestId.aiAssistant.composerFooter)
    const chip = footer.getByTestId(TestId.aiAssistant.providerChip)
    await expect(footer.getByTestId(TestId.aiAssistant.contextMeter)).toBeVisible()
    // the chip shows where the provider runs as an icon; the name is only in the tooltip
    await expect(chip.locator('.icon-laptop')).toBeVisible()
    await expect(chip).toHaveAttribute('title', new RegExp(`^${LONG_LOCAL_NAME} · ${stub!.modelId}`))
    await expect(chip).not.toContainText(LONG_LOCAL_NAME)
    await expect
      .poll(async () => {
        const box = (await footer.boundingBox())!
        const send = (await footer.getByTestId(TestId.aiAssistant.sendBtn).boundingBox())!
        return send.x >= box.x && send.x + send.width <= box.x + box.width
      })
      .toBe(true)
  })

  test('after an answer the meter shows the reported usage against the context size', async ({
    page,
    api,
    sampleSurvey: _,
  }) => {
    const designer = new FormDesigner(page)
    await designer.goto()
    await setLocalProvider(page, api, { enabled: true, baseUrl: stub!.baseUrl, modelId: stub!.modelId })
    await designer.goto()
    await openAssistantPanel(page)
    await expect(assistantPanel(page).getByTestId(TestId.aiAssistant.contextMeter)).toHaveCount(0)

    await sendAssistantMessage(page, LABEL_REQUEST)
    await acceptConsentAndWait(page)

    const meter = assistantPanel(page).getByTestId(TestId.aiAssistant.contextMeter)
    const tokensText = `${compact(STUB_CONTEXT_USED_TOKENS)} / ${compact(STUB_CONTEXT_TOKENS)} tokens`
    await expect(meter).toHaveAttribute('role', 'meter')
    await expect(meter).toHaveAttribute('aria-valuetext', tokensText)
    await expect(meter).toHaveAttribute('aria-valuenow', String(STUB_CONTEXT_USED_TOKENS))
    await expect(meter).toHaveAttribute('aria-valuemax', String(STUB_CONTEXT_TOKENS))
    // the header ring shows the tokens in its tooltip
    await meter.hover()
    await expect(page.getByRole('tooltip')).toHaveText(tokensText)
    expect(stub!.requests.some((request) => request.path === '/v1/chat/completions')).toBe(true)

    // a reload shows the stored usage again: the meter needs no new answer (the status probes of the server are fine)
    const chatRequestsBefore = countChatRequests(stub!)
    await page.reload()
    await openAssistantPanel(page)
    await expect(meter).toHaveAttribute('aria-valuetext', tokensText)
    await expect(meter).toHaveAttribute('aria-valuenow', String(STUB_CONTEXT_USED_TOKENS))
    await expect(meter).toHaveAttribute('aria-valuemax', String(STUB_CONTEXT_TOKENS))
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
    await setLocalProvider(page, api, { enabled: true, baseUrl: stub!.baseUrl, modelId: stub!.modelId })
    await designer.goto()
    await openAssistantPanel(page)
    // the first-use consent is asked once per user, survey and feature: take it with a quick turn, then start over
    await sendAssistantMessage(page, LABEL_REQUEST)
    await acceptConsentAndWait(page)
    await assistantPanel(page).getByTestId(TestId.aiAssistant.newConversationBtn).click()
    await expect(userMessages(page)).toHaveCount(0)

    stub!.setChunkDelay(1000)
    await sendAssistantMessage(page, LABEL_REQUEST)
    await expect(assistantPanel(page)).toHaveAttribute('data-busy', 'true')
    await expect(assistantPanel(page).getByTestId(TestId.aiAssistant.newConversationBtn)).toBeDisabled()
    await expect(assistantPanel(page).getByTestId(TestId.aiAssistant.menuBtn)).toBeDisabled()

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
