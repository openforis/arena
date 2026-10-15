import type { Page } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import type { ArenaApi } from '../fixtures/arenaApi'
import { E2E_LOCAL_PROVIDER_ID } from '../helpers/aiAnalysis'
import { seedLocalProviders } from '../helpers/aiStorage'
import { Urls } from '../helpers/urls'
import { type LocalModelServerStub, startLocalModelServer } from '../stubs/localModelServer'

// the server must run with the mock provider (see test/e2e/README.md)
const aiMock = process.env.E2E_AI_MOCK === 'true'

/**
 * Writes C's stub server as the only local provider before any page script runs (on every navigation of this page),
 * and makes it the default provider.
 * @param {Page} page - The page.
 * @param {ArenaApi} api - The ArenaApi fixture of the same user.
 * @param {LocalModelServerStub} stub - C's stub server.
 * @returns {Promise<void>} Resolves when registered and saved.
 */
const seedLocalProvider = async (page: Page, api: ArenaApi, stub: LocalModelServerStub): Promise<void> => {
  const userUuid = await api.getCurrentUserUuid()
  const providers = [{ id: E2E_LOCAL_PROVIDER_ID, name: 'Local server', baseUrl: stub.baseUrl, modelId: stub.modelId }]
  await seedLocalProviders(page, userUuid, providers)
  await api.setAiDefaultProvider(E2E_LOCAL_PROVIDER_ID)
}

/**
 * Records the URLs of the requests to the gateway endpoint.
 * @param {Page} page - The page.
 * @returns {string[]} The URLs (filled while the test runs).
 */
const collectGatewayRequests = (page: Page): string[] => {
  const urls: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/api/ai/model')) urls.push(request.url())
  })
  return urls
}

/**
 * Opens the dashboard activity section.
 * @param {Page} page - The page.
 * @returns {Promise<void>} Resolves when open.
 */
const openActivitySection = async (page: Page): Promise<void> => {
  await page.goto(Urls.dashboard)
  await page.getByTestId(TestId.dashboard.activityToggle).click()
}

/** Returns the activity log summary modal. */
const summaryModal = (page: Page) => page.locator('.ai-activity-log-summary-modal')

/**
 * Clicks Summarize and, when the first-use dialog appears, accepts it.
 * @param {Page} page - The page.
 * @param {object} [options] - Options.
 * @param {boolean} [options.expectConsent] - Whether the dialog must appear (true) or must not (false).
 * @returns {Promise<void>} Resolves when the modal is open.
 */
const summarize = async (page: Page, { expectConsent }: { expectConsent: boolean }): Promise<void> => {
  await page.locator('.btn-ai-summary').click()
  if (expectConsent) {
    await expect(page.getByTestId(TestId.ai.consentDialog)).toBeVisible()
    await page.getByTestId(TestId.ai.consentContinue).click()
  }
  await expect(summaryModal(page)).toBeVisible()
  if (!expectConsent) await expect(page.getByTestId(TestId.ai.consentDialog)).toHaveCount(0)
}

/**
 * Closes the summary modal.
 * @param {Page} page - The page.
 * @returns {Promise<void>} Resolves when closed.
 */
const closeSummary = async (page: Page): Promise<void> => {
  await summaryModal(page).locator('.modal-close').click()
  await expect(summaryModal(page)).toHaveCount(0)
}

test.describe('Local AI provider (stub local server)', () => {
  test.skip(!aiMock, 'needs a server started with AI_MOCK_PROVIDER_ENABLED=true and AI_DEFAULT_PROVIDER=mock')

  let stub: LocalModelServerStub | null = null

  test.beforeEach(async ({ api }) => {
    await api.enableAiFeatures()
    stub = await startLocalModelServer()
  })

  test.afterEach(async ({ api }) => {
    await stub?.stop()
    stub = null
    await api.setAiDefaultProvider('arena-default')
  })

  test.describe('with the local provider as the default', () => {
    test.beforeEach(async ({ page, api }) => {
      await seedLocalProvider(page, api, stub!)
    })

    test('the activity log summary runs on the stub, not on the gateway', async ({ page, sampleSurvey: _ }) => {
      const gatewayRequests = collectGatewayRequests(page)
      await openActivitySection(page)
      await summarize(page, { expectConsent: true })

      await expect(summaryModal(page)).toContainText('MOCK activity summary.')
      await expect(page.getByTestId(TestId.ai.dataLocationBadge)).toContainText('On this device')
      expect(stub!.requests.some((request) => request.path === '/v1/chat/completions')).toBe(true)
      expect(gatewayRequests).toEqual([])
    })

    test('the stub stops: unreachable message with Retry, and no other provider is used', async ({
      page,
      sampleSurvey: _,
    }) => {
      const gatewayRequests = collectGatewayRequests(page)
      await openActivitySection(page)
      await summarize(page, { expectConsent: true })
      await expect(summaryModal(page)).toContainText('MOCK activity summary.')
      await closeSummary(page)

      await stub!.stop()
      stub = null
      await summarize(page, { expectConsent: false })
      await expect(summaryModal(page)).toContainText('could not be reached')
      await expect(page.getByTestId(TestId.ai.engineErrorRetry)).toBeVisible()

      // Retry probes again: the provider is now known to be unreachable, and nothing falls back to another one
      await page.getByTestId(TestId.ai.engineErrorRetry).click()
      await expect(summaryModal(page)).toContainText('No AI engine can be used for this request.')
      await closeSummary(page)
      await expect(page.locator('.btn-ai-summary')).toBeDisabled()
      await page.getByTestId(TestId.ai.policyBlocked).hover()
      await expect(page.getByTestId(TestId.ai.notAvailable)).toContainText(
        'The selected AI provider is not available right now.'
      )
      expect(gatewayRequests).toEqual([])
    })

    test('the first-use dialog appears once per survey', async ({ page, sampleSurvey: _ }) => {
      await openActivitySection(page)
      await summarize(page, { expectConsent: true })
      await expect(summaryModal(page)).toContainText('MOCK activity summary.')
      await closeSummary(page)

      await summarize(page, { expectConsent: false })
      await expect(summaryModal(page)).toContainText('MOCK activity summary.')
      await closeSummary(page)

      // stored: still not asked after a reload
      await openActivitySection(page)
      await summarize(page, { expectConsent: false })
      await expect(summaryModal(page)).toContainText('MOCK activity summary.')
    })
  })

  // review focus 1: the default is a local provider saved on another computer
  test('a default local provider of another computer: nothing is sent, the profile says so', async ({
    page,
    api,
    sampleSurvey: _,
  }) => {
    await api.setAiDefaultProvider('local:elsewhere')
    const gatewayRequests = collectGatewayRequests(page)
    await openActivitySection(page)

    await expect(page.locator('.btn-ai-summary')).toBeDisabled()
    await page.getByTestId(TestId.ai.policyBlocked).hover()
    await expect(page.getByTestId(TestId.ai.notAvailable)).toContainText(
      'Your default provider is on another computer.'
    )
    await page.getByTestId(TestId.ai.notAvailableAction('openSettings')).click()
    await expect(page).toHaveURL(new RegExp(`${Urls.userProfile}$`))
    await expect(page.getByTestId(TestId.ai.providerDefaultMissing)).toBeVisible()
    expect(gatewayRequests).toEqual([])
    expect(stub!.requests).toEqual([])
  })

  test('Arena default with record data kept on this device: the policy reason is shown', async ({
    page,
    sampleSurvey: _,
  }) => {
    const gatewayRequests = collectGatewayRequests(page)
    await openActivitySection(page)

    await expect(page.locator('.btn-ai-summary')).toBeDisabled()
    await page.getByTestId(TestId.ai.policyBlocked).hover()
    // Arena default is the only candidate and the policy forbids it: only the policy reason is shown
    await expect(page.getByTestId(TestId.ai.policyBlockedTooltip)).toContainText(
      "This survey's AI policy keeps record data on this device."
    )
    expect(gatewayRequests).toEqual([])
  })
})
