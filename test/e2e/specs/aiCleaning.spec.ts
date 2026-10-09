import type { Page } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { ArenaApi } from '../fixtures/arenaApi'
import { plot, tree } from '../fixtures/seed/sampleSurveyModel'
import { getWorkerDataEditor, insertSurveyEditor } from '../fixtures/testUsers'
import {
  applyCardAndCheckStatus,
  askAssistantAboutFirstRow,
  buildInvalidTreeRecord,
  cleaningAreaLabel,
  expectReportRowCount,
  fixedValue,
  recordEditCard,
  useLocalServer,
} from '../helpers/aiCleaning'
import { acceptConsentAndWait, collectRequestBodies, isGatewayRequest } from '../helpers/aiAnalysis'
import { assistantPanel, openAssistantPanel } from '../helpers/assistantPanel'
import { RecordForm } from '../helpers/recordForm'
import { openRecord } from '../helpers/records'
import { Urls } from '../helpers/urls'
import { startLocalModelServer } from '../stubs/localModelServer'

// the server must run with the mock provider (see test/e2e/README.md)
const aiMock = process.env.E2E_AI_MOCK === 'true'

const t = tree.children
const invalidRecord = buildInvalidTreeRecord()

const isBatchUpdateRequest = (request: { url(): string }) => request.url().includes('/records/nodes/update')

test.describe('AI cleaning assistant (mock model on the stub local server)', () => {
  test.skip(!aiMock, 'needs a server started with AI_MOCK_PROVIDER_ENABLED=true and AI_DEFAULT_PROVIDER=mock')

  test.use({ sampleSurveyOptions: { records: [invalidRecord] } })

  let stub: Awaited<ReturnType<typeof startLocalModelServer>>

  test.beforeEach(async ({ api }) => {
    await api.enableAiFeatures()
    stub = await startLocalModelServer()
  })

  test.afterEach(async () => {
    await stub?.stop()
  })

  /**
   * Opens the validation report on the local server, asks about its only row and waits for the card.
   * @param {import('@playwright/test').Page} page - The page.
   * @param {ArenaApi} api - The ArenaApi fixture.
   * @returns {Promise<void>} Resolves when the card shows the proposal.
   */
  const proposeFix = async (page: Page, api: ArenaApi) => {
    await expectReportRowCount(page, 1)
    await useLocalServer(page, api, stub)
    await expectReportRowCount(page, 1)
    await askAssistantAboutFirstRow(page)
    await acceptConsentAndWait(page)
    const card = recordEditCard(page)
    await expect(card).toBeVisible()
    await expect(card.getByTestId(TestId.aiCleaning.edit)).toHaveCount(1)
    await expect(card.getByTestId(TestId.aiCleaning.badge)).toHaveAttribute('data-value', 'fixes')
  }

  test('row action → proposal that fixes the error → Apply → the error is gone', async ({
    page,
    api,
    sampleSurvey: _,
  }) => {
    const gatewayBodies = collectRequestBodies(page, isGatewayRequest)
    const batchBodies = collectRequestBodies(page, isBatchUpdateRequest)

    await proposeFix(page, api)
    await applyCardAndCheckStatus(page, 'applied')

    expect(batchBodies).toHaveLength(1)
    expect(batchBodies[0].edits).toHaveLength(1)
    // record data stays on this device: no turn went to the cloud gateway
    expect(gatewayBodies).toEqual([])
    await expectReportRowCount(page, 0)
  })

  test('a second browser context with the record open sees the new value without reloading', async ({
    page,
    api,
    browser,
    baseURL,
    testUser,
    sampleSurvey: _,
  }) => {
    // spec e2e 2: a separate browser context (its own session and socket), same user
    const viewerContext = await browser.newContext({ baseURL })
    try {
      const login = await viewerContext.request.post('/auth/login', {
        data: { email: testUser.email, password: testUser.password },
      })
      expect(login.ok(), `login of ${testUser.email} failed`).toBeTruthy()
      const viewer = await viewerContext.newPage()
      await openRecord(viewer, invalidRecord.cluster_id)
      const viewerForm = new RecordForm(viewer)
      await viewerForm.gotoPage(plot.name)
      const firstTree = viewerForm.treeRow(tree.name, 0)
      await viewerForm.verify(t.tree_dec_2, '5', firstTree)

      await proposeFix(page, api)
      await applyCardAndCheckStatus(page, 'applied')

      await viewerForm.verify(t.tree_dec_2, fixedValue, firstTree)
    } finally {
      await viewerContext.close()
    }
  })

  test('a value changed after the proposal is a conflict and is not overwritten', async ({
    page,
    api,
    context,
    sampleSurvey: _,
  }) => {
    await proposeFix(page, api)

    const editor = await context.newPage()
    await openRecord(editor, invalidRecord.cluster_id, { unlock: true })
    const editorForm = new RecordForm(editor)
    await editorForm.gotoPage(plot.name)
    const firstTree = editorForm.treeRow(tree.name, 0)
    await editorForm.enter(t.tree_dec_2, '30', firstTree)
    await editorForm.waitForHeaderLoader()

    await applyCardAndCheckStatus(page, 'conflict')
    await expect(recordEditCard(page).getByTestId(TestId.aiCleaning.result).first()).toContainText(
      'the value changed since the proposal'
    )

    await editor.reload()
    await editorForm.gotoPage(plot.name)
    await editorForm.verify(t.tree_dec_2, '30', editorForm.treeRow(tree.name, 0))
  })

  test('without the record cleanse permission there is no Cleaning area and no row action', async ({
    browser,
    baseURL,
    sampleSurvey,
  }, testInfo) => {
    const dataEditor = getWorkerDataEditor(testInfo.parallelIndex)
    await insertSurveyEditor({ user: dataEditor, surveyId: sampleSurvey.id, groupName: 'dataEditor' })
    const editorApi = await ArenaApi.login({ baseURL: baseURL!, user: dataEditor })
    await editorApi.enableAiFeatures()
    await editorApi.dispose()

    const context = await browser.newContext({ baseURL })
    try {
      const login = await context.request.post('/auth/login', {
        data: { email: dataEditor.email, password: dataEditor.password },
      })
      expect(login.ok(), `login of ${dataEditor.email} failed`).toBeTruthy()
      const page = await context.newPage()

      await page.goto(Urls.records)
      await openAssistantPanel(page)
      const areaTabs = assistantPanel(page).getByRole('tab')
      // positive control: the panel lists its areas, so the missing Cleaning tab is a real absence
      await expect(areaTabs.first()).toBeVisible()
      await expect(areaTabs.filter({ hasText: cleaningAreaLabel })).toHaveCount(0)

      // the report is not even routed without the permission: wait for the app to boot, then check its absence
      await Promise.all([
        page.waitForResponse((response) => /\/api\/survey\/\d+\/full/.test(response.url()) && response.ok()),
        page.goto(Urls.validationReport),
      ])
      await expect(page.getByTestId(TestId.validationReport.askAssistantBtn)).toHaveCount(0)
      await expect(
        page.getByTestId(TestId.table.rows(TestId.validationReport.validationReport)).locator('div.table__row')
      ).toHaveCount(0)
    } finally {
      await context.close()
    }
  })
})
