import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { sampleRecords } from '../fixtures/seed/sampleSurveyModel'
import {
  acceptConsentAndWait,
  analysisMessages,
  askAnalysis,
  collectRequestBodies,
  expectAveragesInTable,
  expectedAverages,
  isExplorerQueryRequest,
  isGatewayRequest,
  queryCard,
  reopenLastConversation,
  setLocalServerSettings,
} from '../helpers/aiAnalysis'
import { assistantPanel, openAssistantPanel, waitForAssistantTurn } from '../helpers/assistantPanel'
import { Urls } from '../helpers/urls'
import { startLocalModelServer } from '../stubs/localModelServer'

// the server must run with the mock provider (see test/e2e/README.md)
const aiMock = process.env.E2E_AI_MOCK === 'true'

test.describe('AI analysis assistant (mock provider)', () => {
  test.skip(!aiMock, 'needs a server started with AI_MOCK_PROVIDER_ENABLED=true and AI_DEFAULT_PROVIDER=mock')

  test.use({ sampleSurveyOptions: { records: sampleRecords } })

  test.beforeEach(async ({ api }) => {
    await api.enableAiFeatures()
  })

  test('cloud gateway, default policy: query card, no record data sent', async ({ page, sampleSurvey: _ }) => {
    const gatewayBodies = collectRequestBodies(page, isGatewayRequest)
    await page.goto(Urls.dataExplorer)

    await askAnalysis(page, analysisMessages.propose)
    await waitForAssistantTurn(page)
    await expect(queryCard(page, 'q1')).toBeVisible()

    await page.getByTestId(TestId.aiQueryCard.openInExplorer('q1')).click()
    await expect(page).toHaveURL(new RegExp(`${Urls.dataExplorer}$`))
    await expectAveragesInTable(page)

    // review focus 2: schema only, no data tool, no row value
    expect(gatewayBodies.length).toBeGreaterThan(0)
    for (const body of gatewayBodies) {
      expect(body.dataClass).toBe('schema')
      const text = JSON.stringify(body)
      expect(text).not.toContain('query_run')
      expect(text).not.toContain('query_count')
      for (const value of expectedAverages) expect(text).not.toContain(value)
    }
  })

  test('show as chart opens the bar chart with all rows', async ({ page, sampleSurvey: _ }) => {
    const queryBodies = collectRequestBodies(page, isExplorerQueryRequest)
    await page.goto(Urls.dataExplorer)

    await askAnalysis(page, analysisMessages.propose)
    await waitForAssistantTurn(page)
    await page.getByTestId(TestId.aiQueryCard.showAsChart('q1')).click()

    await expect(page.locator('.data-query-chart-wrapper')).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('.data-query-chart-wrapper .recharts-bar-rectangle')).toHaveCount(3)
    // review focus 5: the chart loads with the chart cap, not the table page size
    expect(queryBodies.some((body) => body.limit === 5000)).toBe(true)
  })

  test.describe('with the stub local server', () => {
    let stub: Awaited<ReturnType<typeof startLocalModelServer>>

    test.beforeEach(async () => {
      stub = await startLocalModelServer()
    })

    test.afterEach(async () => {
      await stub?.stop()
    })

    /**
     * Runs the scripted "run the average" turn on the local server and checks the answer.
     * @param {import('@playwright/test').Page} page - The page.
     * @param {object} api - The ArenaApi fixture.
     * @returns {Promise<string>} The user uuid.
     */
    const runAverageLocally = async (page, api) => {
      await page.goto(Urls.dataExplorer)
      const userUuid = await api.getCurrentUserUuid()
      await setLocalServerSettings(page, { userUuid, enabled: true, baseUrl: stub.baseUrl, modelId: stub.modelId })
      await page.reload()

      await askAnalysis(page, analysisMessages.run)
      await acceptConsentAndWait(page)
      await expect(queryCard(page, 'q1')).toBeVisible()
      return userUuid
    }

    test('runs the query and answers with its result', async ({ page, api, sampleSurvey: _ }) => {
      const gatewayBodies = collectRequestBodies(page, isGatewayRequest)
      const queryBodies = collectRequestBodies(page, isExplorerQueryRequest)

      await runAverageLocally(page, api)

      const answer = page.getByText(/Average of tree_dec_1 by cluster_id \(query q1\)/)
      await expect(answer).toContainText('1: 30.5')
      await expect(answer).toContainText('3: 32.5')
      // query_run asks for one row more than the aggregate cap
      expect(queryBodies.some((body) => body.limit === 201)).toBe(true)
      // the data turn never went to the gateway; the stub received the turn's model calls
      expect(gatewayBodies).toEqual([])
      expect(stub.requests.some((request) => request.path === '/v1/chat/completions')).toBe(true)
    })

    test('a conversation with record data is not continued without the local server', async ({
      page,
      api,
      sampleSurvey: _,
    }) => {
      const userUuid = await runAverageLocally(page, api)

      // review focus 3: the local server is switched off
      await setLocalServerSettings(page, { userUuid, enabled: false, baseUrl: stub.baseUrl, modelId: stub.modelId })
      await page.reload()
      await openAssistantPanel(page)
      // the Explorer selects the Analysis area (schema still allowed on the gateway); the panel starts empty
      await reopenLastConversation(page)

      const panel = assistantPanel(page)
      await expect(panel.getByText('This conversation contains record data.')).toBeVisible()
      await expect(panel.getByRole('button', { name: 'New conversation' })).toBeVisible()
    })
  })
})
