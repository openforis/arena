import type { Page } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { Urls } from '../helpers/urls'
import { type LocalModelServerStub, startLocalModelServer } from '../stubs/localModelServer'

// the server must run with the mock provider (see test/e2e/README.md)
const aiMock = process.env.E2E_AI_MOCK === 'true'

type LocalSettings = { enabled: boolean; baseUrl: string; modelId: string | null; preferLocal: boolean }

/**
 * Writes C's local server settings before any page script runs (on every navigation of this page).
 * @param {Page} page - The page.
 * @param {object} params - Parameters.
 * @param {string} params.userUuid - Logged-in user.
 * @param {LocalSettings} params.settings - Settings.
 * @returns {Promise<void>} Resolves when registered.
 */
const seedLocalServerSettings = async (
  page: Page,
  { userUuid, settings }: { userUuid: string; settings: LocalSettings }
): Promise<void> => {
  await page.addInitScript(
    ({ key, value }) => {
      try {
        localStorage.setItem(key, value)
      } catch {
        // about:blank and other origins without storage
      }
    },
    { key: `arena.ai.localServer.${userUuid}`, value: JSON.stringify(settings) }
  )
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

const closeSummary = async (page: Page): Promise<void> => {
  await summaryModal(page).locator('.modal-close').click()
  await expect(summaryModal(page)).toHaveCount(0)
}

test.describe('Local AI engine (stub local server)', () => {
  test.skip(!aiMock, 'needs a server started with AI_MOCK_PROVIDER_ENABLED=true and AI_DEFAULT_PROVIDER=mock')

  let stub: LocalModelServerStub | null = null

  test.beforeEach(async ({ api }) => {
    await api.enableAiFeatures()
    stub = await startLocalModelServer()
  })

  test.afterEach(async () => {
    await stub?.stop()
    stub = null
  })

  test('turning on the local server: Test lists the stub model', async ({ page }) => {
    await page.goto(Urls.userProfile)
    await page.getByTestId(TestId.ai.localServerEnabled).click()
    const baseUrlInput = page.locator(`input[data-testid="${TestId.ai.localServerBaseUrl}"]`)
    await baseUrlInput.fill(stub!.baseUrl)
    await baseUrlInput.blur()
    await page.getByTestId(TestId.ai.localServerTest).click()

    const result = page.getByTestId(TestId.ai.localServerTestResult)
    await expect(result).toContainText('The server answered.')
    await expect(result).toContainText('On this device')
    // the first successful test picks the first model
    await expect(page.getByTestId(TestId.ai.localServerModel)).toHaveValue(stub!.modelId)
    expect(stub!.requests.some((request) => request.path === '/v1/models')).toBe(true)
  })

  test.describe('with the local server on', () => {
    test.beforeEach(async ({ page, api }) => {
      const userUuid = await api.getCurrentUserUuid()
      await seedLocalServerSettings(page, {
        userUuid,
        settings: { enabled: true, baseUrl: stub!.baseUrl, modelId: stub!.modelId, preferLocal: true },
      })
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

    test('the stub stops: unreachable message with Retry', async ({ page, sampleSurvey: _ }) => {
      await openActivitySection(page)
      await summarize(page, { expectConsent: true })
      await expect(summaryModal(page)).toContainText('MOCK activity summary.')
      await closeSummary(page)

      await stub!.stop()
      stub = null
      await summarize(page, { expectConsent: false })
      await expect(summaryModal(page)).toContainText('could not be reached')
      await expect(page.getByTestId(TestId.ai.engineErrorRetry)).toBeVisible()

      // Retry probes again: the local server is now known to be unreachable, so no engine is left
      await page.getByTestId(TestId.ai.engineErrorRetry).click()
      await expect(summaryModal(page)).toContainText('No AI engine can be used for this request.')
      await closeSummary(page)
      await expect(page.locator('.btn-ai-summary')).toBeDisabled()
      await page.getByTestId(TestId.ai.policyBlocked).hover()
      await expect(page.getByTestId(TestId.ai.notAvailable)).toContainText('The local AI server cannot be reached.')
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

  test('local server off, record data on this device only: the reasons are shown', async ({
    page,
    sampleSurvey: _,
  }) => {
    const gatewayRequests = collectGatewayRequests(page)
    await openActivitySection(page)

    await expect(page.locator('.btn-ai-summary')).toBeDisabled()
    await page.getByTestId(TestId.ai.policyBlocked).hover()
    const notAvailable = page.getByTestId(TestId.ai.notAvailable)
    await expect(notAvailable).toContainText('No local AI server is turned on.')
    await expect(notAvailable).toContainText("The survey AI policy doesn't allow cloud models for this data.")

    await page.getByTestId(TestId.ai.notAvailableAction('turnOnLocalServer')).click()
    await expect(page).toHaveURL(new RegExp(`${Urls.userProfile}$`))
    expect(gatewayRequests).toEqual([])
    expect(stub!.requests).toEqual([])
  })
})
