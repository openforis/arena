import { Page } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { toDisplayValues } from '../fixtures/seed/sampleRecordDisplay'
import { cluster, plot, sampleRecords, tree } from '../fixtures/seed/sampleSurveyModel'
import { RecordForm } from '../helpers/recordForm'
import { openRecord } from '../helpers/records'
import { Urls } from '../helpers/urls'

const { cluster_id } = cluster.children

const recordRows = (page: Page) =>
  page.getByTestId(TestId.table.rows(TestId.records.tableModule)).locator(':scope > div')

test.describe('Records', () => {
  test.use({ sampleSurveyOptions: { records: sampleRecords } })

  test('lists the records of the survey', async ({ page, sampleSurvey: _ }) => {
    await page.goto(Urls.records)
    await expect(recordRows(page)).toHaveCount(sampleRecords.length)
    for (const record of sampleRecords) {
      await expect(
        page.locator(
          `[data-testid="${TestId.records.cellNodeDef(cluster_id.name)}"][data-value="${record.cluster_id}"]`
        )
      ).toBeVisible()
    }
  })

  test('opens a record and shows its values', async ({ page, sampleSurvey: _ }) => {
    const record = sampleRecords[1]
    const values = toDisplayValues(record)
    const form = new RecordForm(page)

    await openRecord(page, record.cluster_id)
    await expect(page.getByTestId(TestId.record.invalidBtn)).toHaveCount(0)

    for (const def of Object.values(cluster.children)) {
      await form.verify(def, values[def.name as keyof typeof values] as any)
    }

    await form.gotoPage(plot.name)
    await form.selectEntity(plot.children.plot_id.label, record.plot_id)
    await form.verify(plot.children.plot_id, values.plot_id)
    await form.verify(plot.children.plot_text, values.plot_text)

    for (const [idx, treeValues] of values.trees.entries()) {
      const row = form.treeRow(tree.name, idx)
      for (const def of Object.values(tree.children)) {
        await form.verify(def, treeValues[def.name as keyof typeof treeValues] as any, row)
      }
    }
  })

  test('deletes records from the records list', async ({ page, sampleSurvey: _ }) => {
    await page.goto(Urls.records)
    await expect(recordRows(page)).toHaveCount(sampleRecords.length)

    for (let remaining = sampleRecords.length; remaining > 0; remaining -= 1) {
      await page.getByTestId(TestId.records.tableRowDeleteButton(0)).click()
      await page.getByTestId(TestId.modal.modal).getByRole('button', { name: 'Ok' }).click()
      if (remaining > 1) {
        await expect(recordRows(page)).toHaveCount(remaining - 1)
      } else {
        await expect(page.getByTestId(TestId.table.noItems)).toBeVisible()
      }
    }
  })
})
