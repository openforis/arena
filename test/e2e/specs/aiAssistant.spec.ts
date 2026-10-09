import type { Page } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
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

// the server must run with the mock provider (see test/e2e/README.md)
const aiMock = process.env.E2E_AI_MOCK === 'true'

// matches the design script /label/i of server/modules/ai/service/mockScripts.ts
const LABEL_REQUEST = 'Change the label of cluster_id to Cluster identifier'

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

  // client-side navigation, as a user reaches the designer from the sidebar
  const navigateInApp = async (page: Page, uri: string): Promise<void> => {
    await page.evaluate((target) => {
      window.history.pushState({}, '', target)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }, uri)
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
