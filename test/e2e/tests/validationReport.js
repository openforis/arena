import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'

import { cluster, plot, tree } from '../mock/nodeDefs'
import { records } from '../mock/records'
import { gotoFormPage } from './_formDesigner'
import { gotoHome, gotoRecords, gotoValidationReport } from './_navigation'
import { enterAttribute, getTreeSelector } from './_record'
import { gotoRecord } from './_records'

/* eslint-disable camelcase */
const { cluster_id } = cluster.children
const { plot_id } = plot.children
const { tree_id, tree_dec_2 } = tree.children

const record1 = records[0]
const record2 = records[1]
const record3 = records[2]

const { validationReport } = DataTestId.validationReport
const getMessagesEl = async (path) => {
  await page.waitForSelector(`[data-value="${path}"] + ${getSelector(DataTestId.validationReport.cellMessages)}`)
  return page.$(`[data-value="${path}"] + ${getSelector(DataTestId.validationReport.cellMessages)}`)
}

const waitThread = (timeout = 1500) =>
  test('Wait thread to complete', async () => {
    // TODO thread issue: https://github.com/openforis/arena/issues/1412
    await page.waitForTimeout(timeout)
  })

const gotoNode = (path) =>
  test(`Goto ${path}`, async () => {
    const messagesEl = await getMessagesEl(path)
    await Promise.all([
      page.waitForSelector(getSelector(DataTestId.surveyForm.surveyForm)),
      page.waitForNavigation(),
      messagesEl.click(),
    ])
  })

const expectMessages = (messages) => {
  if (messages.length > 0) {
    messages.forEach(([path, message], idx) =>
      test(`Verify messages ${path}`, async () => {
        await page.waitForSelector(getSelector(DataTestId.table.row(DataTestId.validationReport.validationReport, idx)))
        const messagesEl = await getMessagesEl(path)
        await expect(await messagesEl.getAttribute('data-value')).toBe(message)
      })
    )
  } else {
    test('Verify validation report empty', async () => {
      await expect(page).toHaveText('No Items')
    })
  }

  test(`Verify messages to be ${messages.length}`, async () => {
    const rowsSelector = getSelector(DataTestId.table.rows(validationReport))

    const rowsEl = await page.$$(`${rowsSelector} div.table__row`)
    await expect(rowsEl.length).toBe(messages.length)
  })
}

export default () =>
  describe('Validation report', () => {
    gotoValidationReport()
    expectMessages([])

    describe(`Duplicate root entity key`, () => {
      gotoRecords()
      gotoRecord(record2)
      enterAttribute(cluster_id, '6')
      waitThread()

      gotoRecords()
      gotoRecord(record3)
      enterAttribute(cluster_id, '6')
      waitThread()

      gotoValidationReport()
      expectMessages([
        [`Cluster[6] / Cluster id`, 'Duplicate record key'],
        [`Cluster[6] / Cluster id`, 'Duplicate record key'],
      ])
    })

    describe(`Restore root entity key`, () => {
      gotoNode('Cluster[6] / Cluster id')
      enterAttribute(cluster_id, '9')
      waitThread()

      gotoValidationReport()
      expectMessages([])
    })

    describe(`Invalidate record ${cluster_id.name} ${record1[cluster_id.name]}`, () => {
      gotoRecords()
      gotoRecord(record1)
      enterAttribute(cluster_id, '')
      gotoFormPage(plot)
      enterAttribute(plot_id, '')
      enterAttribute(tree_id, '', getTreeSelector(0))
      enterAttribute(tree_dec_2, '0', getTreeSelector(0))
      enterAttribute(tree_id, '10', getTreeSelector(1))
      enterAttribute(tree_id, '10', getTreeSelector(2))
      enterAttribute(tree_id, '0', getTreeSelector(3))
      waitThread()

      gotoValidationReport()
      expectMessages([['Cluster[] / Cluster id', 'Required value']])
    })

    describe(`Verify non relevant nodes get validated`, () => {
      gotoNode('Cluster[] / Cluster id')
      enterAttribute(cluster_id, record1[cluster_id.name])
      waitThread()

      gotoValidationReport()
      expectMessages([
        [`Cluster[${record1[cluster_id.name]}] / Plot[] / Plot id`, 'Required value'],
        [`Cluster[${record1[cluster_id.name]}] / Plot[] / Tree[10] / Tree id`, 'Duplicate entity key'],
        [`Cluster[${record1[cluster_id.name]}] / Plot[] / Tree[10] / Tree id`, 'Duplicate entity key'],
        [`Cluster[${record1[cluster_id.name]}] / Plot[] / Tree[] / Tree id`, 'Required value'],
        [`Cluster[${record1[cluster_id.name]}] / Plot[] / Tree[] / Tree decimal 2`, 'tree_dec_2 > 0'],
      ])
    })

    describe(`Edit node in page`, () => {
      gotoNode(`Cluster[${record1[cluster_id.name]}] / Plot[] / Tree[] / Tree decimal 2`)
      enterAttribute(plot_id, record1[plot_id.name])

      enterAttribute(tree_id, record1.trees[0][tree_id.name], getTreeSelector(0))
      enterAttribute(tree_dec_2, record1.trees[0][tree_dec_2.name], getTreeSelector(0))
      waitThread()

      gotoValidationReport()
      expectMessages([
        [
          `Cluster[${record1[cluster_id.name]}] / Plot[${record1[plot_id.name]}] / Tree[10] / Tree id`,
          'Duplicate entity key',
        ],
        [
          `Cluster[${record1[cluster_id.name]}] / Plot[${record1[plot_id.name]}] / Tree[10] / Tree id`,
          'Duplicate entity key',
        ],
      ])
    })

    describe(`Verify non relevant nodes validation is cleared`, () => {
      gotoRecords()
      gotoRecord(record1)
      enterAttribute(cluster_id, '')
      waitThread()

      gotoValidationReport()
      expectMessages([['Cluster[] / Cluster id', 'Required value']])
    })

    gotoHome()
  })
