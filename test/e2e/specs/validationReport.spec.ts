import { Page, Response } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { getTaxon } from '../fixtures/seed/sampleRecordDisplay'
import { cluster, plot, sampleRecords, SampleRecord, tree } from '../fixtures/seed/sampleSurveyModel'
import { RecordForm } from '../helpers/recordForm'
import { openRecord, unlockRecord } from '../helpers/records'
import { Urls } from '../helpers/urls'

const c = cluster.children
const p = plot.children
const t = tree.children

type Message = [path: string, message: string]

const reportRows = (page: Page) =>
  page.getByTestId(TestId.table.rows(TestId.validationReport.validationReport)).locator('div.table__row')

/**
 * Reads the validation report messages as [path, message] pairs (sorted).
 * @param {Page} page - The page.
 * @returns {Promise<Message[]>} - The messages.
 */
const readMessages = async (page: Page): Promise<Message[]> => {
  const messageCells = page.getByTestId(TestId.validationReport.cellMessages)
  const messages: Message[] = []
  for (const cell of await messageCells.all()) {
    const path = await cell.evaluate((el) => el.previousElementSibling?.getAttribute('data-value') ?? '')
    messages.push([path, (await cell.getAttribute('data-value')) ?? ''])
  }
  return messages.sort()
}

/**
 * Opens the validation report and waits for it to contain exactly the specified messages
 * (record validation is updated asynchronously, so the report is polled).
 * @param {Page} page - The page.
 * @param {Message[]} expected - Expected messages.
 * @returns {Promise<void>} - Resolves when the report contains the expected messages.
 */
const expectReportMessages = async (page: Page, expected: Message[]): Promise<void> => {
  await expect
    .poll(
      async () => {
        // "no items" is shown also while the report is loading: wait for the report data to be fetched
        const isReportResponse = (suffix: string) => (response: Response) =>
          new URL(response.url()).pathname.endsWith(suffix) && response.ok()
        await Promise.all([
          page.waitForResponse(isReportResponse('/validationReport')),
          page.waitForResponse(isReportResponse('/validationReport/count')),
          page.goto(Urls.validationReport),
        ])
        await expect(page.getByTestId(TestId.table.noItems).or(reportRows(page).first())).toBeVisible()
        return readMessages(page)
      },
      { timeout: 30_000, intervals: [500, 1000, 2000] }
    )
    .toEqual([...expected].sort())
}

const [record1, record2, record3] = sampleRecords

test.describe('Validation report', () => {
  test.describe('with valid records', () => {
    test.use({ sampleSurveyOptions: { records: sampleRecords } })

    test('is empty when all the records are valid', async ({ page, sampleSurvey: _ }) => {
      await expectReportMessages(page, [])
    })

    test('reports duplicate record keys and clears them when fixed', async ({ page, sampleSurvey: _ }) => {
      const form = new RecordForm(page)

      await openRecord(page, record2.cluster_id, { unlock: true })
      await form.enter(c.cluster_id, record3.cluster_id)

      await expectReportMessages(page, [
        [`Cluster[${record3.cluster_id}] / Cluster id`, 'Duplicate record key'],
        [`Cluster[${record3.cluster_id}] / Cluster id`, 'Duplicate record key'],
      ])

      await openRecord(page, record3.cluster_id, { unlock: true })
      await form.enter(c.cluster_id, '99')

      await expectReportMessages(page, [])
    })

    test('reports duplicate values of unique attributes', async ({ page, sampleSurvey: _ }) => {
      const form = new RecordForm(page)

      await openRecord(page, record1.cluster_id, { unlock: true })
      await form.enter(c.cluster_coordinate, record2.cluster_coordinate)

      await expectReportMessages(page, [
        [`Cluster[${record1.cluster_id}] / Cluster coordinate`, 'Duplicate value'],
        [`Cluster[${record2.cluster_id}] / Cluster coordinate`, 'Duplicate value'],
      ])
    })
  })

  test.describe('with a record with errors in a non relevant page', () => {
    // cluster_id empty: plot is not relevant (relevant if cluster_id > 0), so its errors are not reported
    const invalidRecord: SampleRecord = {
      ...record1,
      cluster_id: '',
      plot_id: '',
      trees: [
        { ...record1.trees[0], tree_id: '', tree_dec_2: '0' },
        { ...record1.trees[1], tree_id: '10' },
        { ...record1.trees[2], tree_id: '10' },
      ],
    }
    test.use({ sampleSurveyOptions: { records: [invalidRecord] } })

    test('validates the nodes becoming relevant and allows fixing them from the report', async ({
      page,
      sampleSurvey: _,
    }) => {
      const form = new RecordForm(page)

      await expectReportMessages(page, [['Cluster[] / Cluster id', 'Required value']])

      // open the record from the validation report
      await page.getByTestId(TestId.validationReport.cellMessages).first().click()
      await expect(page.getByTestId(TestId.surveyForm.surveyForm)).toBeVisible()
      await unlockRecord(page)
      await form.enter(c.cluster_id, '5')

      const plotPath = 'Cluster[5] / Plot[]'
      await expectReportMessages(page, [
        [`${plotPath} / Plot id`, 'Required value'],
        [`${plotPath} / Tree[10] / Tree id`, 'Duplicate entity key'],
        [`${plotPath} / Tree[10] / Tree id`, 'Duplicate entity key'],
        [`${plotPath} / Tree[] / Tree id`, 'Required value'],
        [`${plotPath} / Tree[] / Tree decimal 2`, 'tree_dec_2 > 0'],
      ])

      // open the page of a tree node from the report and fix the errors
      await page
        .locator(
          `[data-value="${plotPath} / Tree[] / Tree decimal 2"] + [data-testid="${TestId.validationReport.cellMessages}"]`
        )
        .click()
      await expect(page.getByTestId(TestId.surveyForm.surveyForm)).toBeVisible()
      await unlockRecord(page)

      await form.enter(p.plot_id, '3')
      const [tree1, tree2, tree3] = [0, 1, 2].map((idx) => form.treeRow(tree.name, idx))
      await form.enter(t.tree_id, '1', tree1)
      await form.enter(t.tree_dec_2, '25', tree1)
      await form.enter(t.tree_id, '2', tree2)
      // same species of the first tree (tree_species is unique)
      await form.enter(t.tree_species, getTaxon(record1.trees[0].tree_species), tree3)

      await expectReportMessages(page, [
        ['Cluster[5] / Plot[3] / Tree[1] / Tree Species', 'Duplicate value'],
        ['Cluster[5] / Plot[3] / Tree[10] / Tree Species', 'Duplicate value'],
      ])
    })
  })
})
