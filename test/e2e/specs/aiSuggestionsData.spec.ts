import type { Page, Response } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { sampleRecords, type SampleRecord } from '../fixtures/seed/sampleSurveyModel'
import { acceptConsentAndWait, analysisAreaLabel, collectRequestBodies, isGatewayRequest } from '../helpers/aiAnalysis'
import { cleaningAreaLabel, useLocalServer } from '../helpers/aiCleaning'
import { assistantPanel, lastAssistantAnswer, openAssistantPanel, selectAssistantArea } from '../helpers/assistantPanel'
import { Urls } from '../helpers/urls'
import { startLocalModelServer, type LocalModelServerStub } from '../stubs/localModelServer'

// the server must run with the mock provider (see test/e2e/README.md)
const aiMock = process.env.E2E_AI_MOCK === 'true'

// trees whose tree_dec_2 (5) breaks the validation "tree_dec_2 > 10": one report row each
const INVALID_TREES = 20

const validationCardText = /^\d+ validation messages in this cycle\. Summarise the patterns\?$/
const importCardText = 'Imported 2 records. Get a quick overview?'

/**
 * Returns the first sample record with INVALID_TREES invalid trees (distinct keys, no species).
 * @returns {SampleRecord} The record.
 */
const buildRecordWithManyErrors = (): SampleRecord => {
  const [record] = sampleRecords
  const trees = Array.from({ length: INVALID_TREES }, (_, index) => ({
    tree_id: String(index + 1),
    tree_dec_1: '10.5',
    tree_dec_2: '5',
    tree_species: '',
  }))
  return { ...record, trees }
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

/**
 * Counts the chat requests the stub local server received.
 * @param {LocalModelServerStub} stub - The stub.
 * @returns {number} The count.
 */
const countChatRequests = (stub: LocalModelServerStub): number =>
  stub.requests.filter((request) => request.path === '/v1/chat/completions').length

/**
 * Reloads the page and waits for the app to boot (refresh tokens rotate: an aborted boot logs the user out).
 * @param {Page} page - The page.
 * @returns {Promise<void>} Resolves after the boot.
 */
const reloadAndWaitForBoot = async (page: Page): Promise<void> => {
  await Promise.all([
    page.waitForResponse(
      (response: Response) =>
        response.url().includes('/api/ai/settings') && response.request().method() === 'GET' && response.ok()
    ),
    page.reload(),
  ])
}

/**
 * Opens the panel on an area and waits until the area is available (the composer shows only then).
 * @param {Page} page - The page.
 * @param {string} label - Area tab label.
 * @returns {Promise<void>} Resolves when the area is usable.
 */
const openArea = async (page: Page, label: string): Promise<void> => {
  await openAssistantPanel(page)
  await selectAssistantArea(page, label)
  await expect(assistantPanel(page).getByTestId(TestId.aiAssistant.input)).toBeVisible({ timeout: 15_000 })
}

/**
 * Reads the ids of the pending suggestions of a survey from the suggestion store's localStorage key (spec §3.2).
 * @param {Page} page - The page.
 * @param {string} userUuid - User uuid.
 * @param {number} surveyId - Survey id.
 * @returns {Promise<string[]>} The ids.
 */
const readPendingSuggestionIds = (page: Page, userUuid: string, surveyId: number): Promise<string[]> =>
  page.evaluate(
    ([key, bucket]) => {
      try {
        const state = JSON.parse(localStorage.getItem(key) ?? '{}')
        return (state.pending?.[bucket] ?? []).map((suggestion: { id: string }) => suggestion.id)
      } catch {
        return []
      }
    },
    [`arena.ai.suggestions.${userUuid}`, String(surveyId)]
  )

test.describe('AI suggestion: many validation messages (stub local server)', () => {
  test.skip(!aiMock, 'needs a server started with AI_MOCK_PROVIDER_ENABLED=true and AI_DEFAULT_PROVIDER=mock')

  test.use({ sampleSurveyOptions: { records: [buildRecordWithManyErrors()] } })

  let stub: LocalModelServerStub

  test.beforeEach(async ({ api }) => {
    await api.enableAiFeatures()
    stub = await startLocalModelServer()
  })

  test.afterEach(async () => {
    await stub?.stop()
  })

  test('opening the report offers a summary; Do it sends the prompt to the local model', async ({
    page,
    api,
    sampleSurvey,
  }) => {
    // record validations are computed asynchronously after the seed
    await expect
      .poll(() => api.countValidationReportRows(sampleSurvey.id), { timeout: 30_000, intervals: [500, 1000, 2000] })
      .toBeGreaterThanOrEqual(INVALID_TREES)
    const gatewayBodies = collectRequestBodies(page, isGatewayRequest)

    await page.goto(Urls.records)
    await useLocalServer(page, api, stub)
    // the Cleaning area needs the local server: wait until it is available, then open the report inside the app
    await openArea(page, cleaningAreaLabel)
    await navigateInApp(page, Urls.validationReport)

    const panel = assistantPanel(page)
    const card = panel.getByText(validationCardText)
    await expect(card).toBeVisible({ timeout: 15_000 })
    const count = Number(/^\d+/.exec((await card.textContent()) ?? '')?.[0])
    expect(count).toBeGreaterThanOrEqual(INVALID_TREES)
    // success criterion 1: nothing went to an AI engine before Do it
    expect(countChatRequests(stub)).toBe(0)
    expect(gatewayBodies).toEqual([])

    await panel.getByRole('button', { name: 'Do it', exact: true }).click()
    await acceptConsentAndWait(page)
    await expect(panel.getByTestId(TestId.aiAssistant.message('user')).last()).toContainText(
      'Summarise the validation errors and warnings of this survey in the current cycle.'
    )
    await expect(lastAssistantAnswer(page)).toContainText(`MOCK: ${count} validation messages`)
    expect(countChatRequests(stub)).toBeGreaterThan(0)
    // record data stays on this device
    expect(gatewayBodies).toEqual([])
    // a turn that ends without a change-set card puts the suggestion back (spec §3.2)
    await expect(card).toBeVisible()
  })
})

test.describe('AI suggestion: data imported (mock provider)', () => {
  test.skip(!aiMock, 'needs a server started with AI_MOCK_PROVIDER_ENABLED=true and AI_DEFAULT_PROVIDER=mock')

  test.use({ sampleSurveyOptions: { withExpressions: false } })

  test.beforeEach(async ({ api }) => {
    await api.enableAiFeatures()
  })

  test('a succeeded import offers an overview in Analysis; Dismiss keeps it away', async ({
    page,
    api,
    sampleSurvey,
  }) => {
    const gatewayBodies = collectRequestBodies(page, isGatewayRequest)
    // job updates reach the page through its socket: wait for it before starting the import
    const socketOpened = page.waitForEvent('websocket', (socket) => socket.url().includes('/socket.io/'))
    await page.goto(Urls.records)
    await socketOpened
    await openArea(page, analysisAreaLabel)

    const nodeDefUuid = await api.getRootNodeDefUuid(sampleSurvey.id)
    const job = await api.startFlatDataImport({ surveyId: sampleSurvey.id, nodeDefUuid, csv: 'cluster_id\n101\n102\n' })
    const jobEnded = await api.waitForJob(job.uuid)
    expect(jobEnded.result?.insertedRecords).toBe(2)

    const userUuid = await api.getCurrentUserUuid()
    await expect
      .poll(() => readPendingSuggestionIds(page, userUuid, sampleSurvey.id), { timeout: 15_000 })
      .toContain('dataImported:latest')

    // the pushed job updates opened the job monitor: continue on a fresh page (the suggestion is stored)
    await reloadAndWaitForBoot(page)
    await openArea(page, analysisAreaLabel)
    const panel = assistantPanel(page)
    await expect(panel.getByText(importCardText, { exact: true })).toBeVisible()
    expect(gatewayBodies).toEqual([])

    await panel.getByRole('button', { name: 'Dismiss', exact: true }).click()
    await expect(panel.getByText(importCardText, { exact: true })).toHaveCount(0)

    await reloadAndWaitForBoot(page)
    await openArea(page, analysisAreaLabel)
    await expect(panel.getByText(importCardText, { exact: true })).toHaveCount(0)
    expect(gatewayBodies).toEqual([])
  })
})
