import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { cluster, plot } from '../fixtures/seed/sampleSurveyModel'
import { RecordForm } from '../helpers/recordForm'
import { Urls } from '../helpers/urls'

const c = cluster.children
const p = plot.children

// in the sample survey, "plot" is relevant only if cluster_id > 0
test.describe('Record: clear values becoming non-relevant', () => {
  test('asks for confirmation before clearing the values of non-relevant nodes', async ({ page, sampleSurvey: _ }) => {
    const form = new RecordForm(page)
    const modal = page.getByTestId(TestId.modal.modal)

    await page.goto(Urls.records)
    await page.getByTestId(TestId.records.addBtn).click()
    await expect(page.getByTestId(TestId.surveyForm.surveyForm)).toBeVisible()

    await form.enter(c.cluster_id, '11')
    await form.gotoPage(plot.name)
    await form.addFormEntity()
    await form.enter(p.plot_id, '1')
    await form.gotoPage(cluster.name)

    // plot becomes non-relevant: the user is asked to confirm
    await form.enter(c.cluster_id, '0')
    await expect(modal).toContainText('will no longer be relevant')
    await expect(modal).toContainText(plot.label)

    // cancel: the update is reverted
    await modal.getByRole('button', { name: 'Cancel' }).click()
    await expect(modal).toBeHidden()
    await form.verify(c.cluster_id, '11')
    await form.gotoPage(plot.name)
    await form.verify(p.plot_id, '1')
    await form.gotoPage(cluster.name)

    // confirm: the update is applied and the plot (no longer relevant) is deleted
    await form.enter(c.cluster_id, '0')
    await expect(modal).toContainText(plot.label)
    const updateConfirmed = page.waitForResponse(
      (response) => response.request().method() === 'POST' && /\/record\/[\w-]+\/node$/.test(response.url())
    )
    await modal.getByRole('button', { name: 'Ok' }).click()
    await updateConfirmed
    await form.waitForHeaderLoader()
    await form.verify(c.cluster_id, '0')

    // plot relevant again: no plot left
    await form.enter(c.cluster_id, '12')
    await expect(modal).toBeHidden()
    await form.gotoPage(plot.name)
    await expect(form.nodeDefWrapper(p.plot_id.name)).toHaveCount(0)
  })
})
