import type { Page } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import type { ArenaApi } from '../fixtures/arenaApi'
import { collectRequestBodies, isGatewayRequest, reopenLastConversation } from '../helpers/aiAnalysis'
import {
  assistantPanel,
  lastAssistantAnswer,
  openAssistantPanel,
  sendAssistantMessage,
  waitForAssistantTurn,
} from '../helpers/assistantPanel'
import { FormDesigner } from '../helpers/formDesigner'
import { Urls } from '../helpers/urls'
import { type LocalModelServerStub, startLocalModelServer } from '../stubs/localModelServer'

// the server must run with the mock provider (see test/e2e/README.md)
const aiMock = process.env.E2E_AI_MOCK === 'true'

// matches the design script /label/i of server/modules/ai/service/mockScripts.ts
const LABEL_REQUEST = 'Change the label of cluster_id to Cluster identifier'

/**
 * Reads the local providers this browser stores for the logged-in user.
 * @param {Page} page - The page.
 * @param {ArenaApi} api - The ArenaApi fixture of the same user.
 * @returns {Promise<Array<Record<string, string>>>} The stored providers ([] when none).
 */
const readLocalProviders = async (page: Page, api: ArenaApi): Promise<Array<Record<string, string>>> => {
  const key = `arena.ai.localProviders.${await api.getCurrentUserUuid()}`
  return JSON.parse((await page.evaluate((storageKey) => localStorage.getItem(storageKey), key)) ?? '[]')
}

/**
 * Runs an action of a provider row's ⋯ menu.
 * @param {Page} page - The page (on the user profile).
 * @param {string} providerId - Provider id.
 * @param {string} action - Menu action (makeDefault, test, edit, remove).
 * @returns {Promise<void>} Resolves after the click.
 */
const runRowAction = async (page: Page, providerId: string, action: string): Promise<void> => {
  await page.getByTestId(TestId.ai.providerMenu(providerId)).click()
  await page.getByTestId(TestId.ai.providerMenuItem(action)).click()
}

/** Returns the provider chip of the assistant composer footer. */
const providerChip = (page: Page) => assistantPanel(page).getByTestId(TestId.aiAssistant.providerChip)

/**
 * Opens the assistant on the form designer, on a new conversation of the Design area.
 * @param {Page} page - The page.
 * @returns {Promise<void>} Resolves when the composer is shown.
 */
const openNewDesignConversation = async (page: Page): Promise<void> => {
  await new FormDesigner(page).goto()
  await openAssistantPanel(page)
  await assistantPanel(page).getByTestId(TestId.aiAssistant.homeNewConversationBtn).click()
}

/**
 * Leaves the worker's user with no account provider, Arena default as the default and AI off, for the other specs.
 * @param {ArenaApi} api - The ArenaApi fixture.
 * @returns {Promise<void>} Resolves when saved.
 */
const resetAiProviders = async (api: ArenaApi): Promise<void> => {
  const settings = await api.getAiSettings()
  for (const provider of settings.providers ?? []) await api.removeAiAccountProvider(provider.id)
  await api.setAiDefaultProvider('arena-default')
  await api.disableAiFeatures()
}

test.describe('AI provider list and dialog (mock provider, stub local server)', () => {
  test.skip(!aiMock, 'needs a server started with AI_MOCK_PROVIDER_ENABLED=true and AI_DEFAULT_PROVIDER=mock')

  let stub: LocalModelServerStub | null = null

  test.beforeEach(async ({ api }) => {
    await api.enableAiFeatures()
    stub = await startLocalModelServer()
  })

  test.afterEach(async ({ api }) => {
    await stub?.stop()
    stub = null
    await resetAiProviders(api)
  })

  test('adds a local provider after a passing test, makes it the default, removes it', async ({ page, api }) => {
    await page.goto(Urls.userProfile)
    await page.getByTestId(TestId.ai.providersAdd).click()
    await page.getByTestId(TestId.ai.providerType('local')).click()
    await page.locator(`input[data-testid="${TestId.ai.providerBaseUrl}"]`).fill(stub!.baseUrl)
    // nothing can be saved before a passing test of the current values
    await expect(page.getByTestId(TestId.ai.providerSave)).toBeDisabled()

    await page.getByTestId(TestId.ai.providerTest).click()
    await expect(page.getByTestId(TestId.ai.providerTestResult)).toContainText('Answered')
    // the first listed model is chosen
    await expect(page.getByTestId(TestId.ai.providerModel)).toHaveValue(stub!.modelId)
    await page.locator(`input[data-testid="${TestId.ai.providerName}"]`).fill('Desk server')
    await page.getByTestId(TestId.ai.providerSave).click()
    await expect(page.getByTestId(TestId.ai.providerDialog)).toHaveCount(0)

    // stored in this browser only, never on the server
    await expect
      .poll(() => readLocalProviders(page, api))
      .toEqual([expect.objectContaining({ name: 'Desk server', baseUrl: stub!.baseUrl, modelId: stub!.modelId })])
    const [local] = await readLocalProviders(page, api)
    expect(local.id).toMatch(/^local:/)
    expect((await api.getAiSettings()).providers).toEqual([])
    const row = page.getByTestId(TestId.ai.providerRow(local.id))
    await expect(row).toContainText('Desk server')

    await runRowAction(page, local.id, 'makeDefault')
    await expect(row.getByTestId(TestId.ai.providerDefault)).toBeVisible()
    await expect.poll(async () => (await api.getAiSettings()).defaultProviderId).toBe(local.id)

    await runRowAction(page, local.id, 'remove')
    await page.getByTestId(TestId.modal.modal).getByRole('button', { name: 'Ok' }).click()
    await expect(row).toHaveCount(0)
    await expect.poll(async () => (await api.getAiSettings()).defaultProviderId).toBe('arena-default')
    expect(await readLocalProviders(page, api)).toEqual([])
  })

  test('adds an account provider (mock) after a passing test', async ({ page, api }) => {
    await page.goto(Urls.userProfile)
    await page.getByTestId(TestId.ai.providersAdd).click()
    await page.getByTestId(TestId.ai.providerType('mock')).click()
    await expect(page.getByTestId(TestId.ai.providerSave)).toBeDisabled()

    await page.getByTestId(TestId.ai.providerTest).click()
    await expect(page.getByTestId(TestId.ai.providerTestResult)).toContainText('Answered in')
    await expect(page.getByTestId(TestId.ai.providerModel)).toHaveValue('mock')
    await page.locator(`input[data-testid="${TestId.ai.providerName}"]`).fill('Mock account')
    await page.getByTestId(TestId.ai.providerSave).click()
    await expect(page.getByTestId(TestId.ai.providerDialog)).toHaveCount(0)

    await expect
      .poll(async () => (await api.getAiSettings()).providers)
      .toEqual([expect.objectContaining({ type: 'mock', name: 'Mock account', lastTestOk: true })])
    const [provider] = (await api.getAiSettings()).providers
    expect(provider.id).toMatch(/^acct:/)
    await expect(page.getByTestId(TestId.ai.providerRow(provider.id))).toContainText('Mock account')
  })
})

test.describe('AI provider chip in the assistant (mock provider)', () => {
  test.skip(!aiMock, 'needs a server started with AI_MOCK_PROVIDER_ENABLED=true and AI_DEFAULT_PROVIDER=mock')

  test.use({ sampleSurveyOptions: { withExpressions: false, publish: false } })

  test.beforeEach(async ({ api }) => {
    await api.enableAiFeatures()
  })

  test.afterEach(async ({ api }) => {
    await resetAiProviders(api)
  })

  // review focus 5
  test('a conversation answers with its chosen provider; after its removal the default answers, with a notice', async ({
    page,
    api,
    sampleSurvey: _,
  }) => {
    const { provider } = await api.addAiAccountProvider({ type: 'mock', name: 'Mock account', model: 'mock' })
    await openNewDesignConversation(page)
    await expect(providerChip(page)).toContainText('Arena default · mock')

    const chosenBodies = collectRequestBodies(page, isGatewayRequest)
    await providerChip(page).click()
    await page.getByTestId(TestId.aiAssistant.providerChoice(provider.id)).click()
    await expect(providerChip(page)).toContainText('Mock account · mock')

    await sendAssistantMessage(page, LABEL_REQUEST)
    await waitForAssistantTurn(page)
    await expect(lastAssistantAnswer(page)).toContainText('MOCK: I proposed a new label for')
    expect(chosenBodies.length).toBeGreaterThan(0)
    expect(chosenBodies.every((body) => body.providerId === provider.id)).toBe(true)

    // the provider is removed elsewhere: the conversation uses the default and says so, without asking
    await api.removeAiAccountProvider(provider.id)
    await page.reload()
    await openAssistantPanel(page)
    await reopenLastConversation(page)
    await expect(assistantPanel(page).getByTestId(TestId.aiAssistant.providerRemovedNotice)).toBeVisible()
    await expect(providerChip(page)).toContainText('Arena default · mock')

    const defaultBodies = collectRequestBodies(page, isGatewayRequest)
    await sendAssistantMessage(page, LABEL_REQUEST)
    await waitForAssistantTurn(page)
    expect(defaultBodies.length).toBeGreaterThan(0)
    expect(defaultBodies.every((body) => body.providerId === 'arena-default')).toBe(true)
  })

  // review focus 1, in the chat
  test('a default local provider of another computer: nothing is sent until another provider is chosen', async ({
    page,
    api,
    sampleSurvey: _,
  }) => {
    await api.setAiDefaultProvider('local:elsewhere')
    const gatewayBodies = collectRequestBodies(page, isGatewayRequest)
    await openNewDesignConversation(page)
    await expect(providerChip(page)).toContainText('Default provider not on this computer')

    await providerChip(page).click()
    await expect(page.getByTestId(TestId.aiAssistant.providerChooser)).toBeVisible()
    expect(gatewayBodies).toEqual([])
    await page.getByTestId(TestId.aiAssistant.providerChoice('arena-default')).click()
    await expect(providerChip(page)).toContainText('Arena default · mock')

    await sendAssistantMessage(page, LABEL_REQUEST)
    await waitForAssistantTurn(page)
    expect(gatewayBodies.length).toBeGreaterThan(0)
    expect(gatewayBodies.every((body) => body.providerId === 'arena-default')).toBe(true)
  })
})
