import { TestId, getSelector } from '../../../webapp/utils/testId'

import { cluster, plot, tree } from '../mock/nodeDefs'
import { records } from '../mock/records'
import { gotoFormPage, selectForm } from './_formDesigner'
import { gotoHome, gotoRecords, gotoValidationReport } from './_navigation'
import { enterAttribute, getTreeSelector } from './_record'
import { gotoRecord, unlockRecordEdit } from './_records'
import { expectNoItems } from './_tables'

const DUPLICATE_VALUE = 'Duplicate value'

/* eslint-disable camelcase */
const { cluster_id, cluster_coordinate } = cluster.children
const { plot_id } = plot.children
const { tree_id, tree_dec_2, tree_species } = tree.children

const record1 = records[0]
const record2 = records[1]
const record3 = records[2]

const { validationReport } = TestId.validationReport
const getMessagesEl = async (path) => {
  await page.waitForSelector(`[data-value="${path}"] + ${getSelector(TestId.validationReport.cellMessages)}`)
  return page.$(`[data-value="${path}"] + ${getSelector(TestId.validationReport.cellMessages)}`)
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
      page.waitForSelector(getSelector(TestId.surveyForm.surveyForm)),
      page.waitForNavigation(),
      messagesEl.click(),
    ])
  })

const expectMessages = (messages) => {
  if (messages.length > 0) {
    messages.forEach(([path, message], idx) =>
      test(`Verify messages ${path}`, async () => {
        await page.waitForSelector(getSelector(TestId.table.row(TestId.validationReport.validationReport, idx)))
        const messagesEl = await getMessagesEl(path)
        await expect(messagesEl).not.toBeNull()
        await expect(await messagesEl.getAttribute('data-value')).toBe(message)
      })
    )
  } else {
    test('Verify validation report empty', async () => {
      await expectNoItems()
    })
  }

  test(`Verify messages to be ${messages.length}`, async () => {
    const rowsSelector = getSelector(TestId.table.rows(validationReport))

    const rowsEl = await page.$$(`${rowsSelector} div.table__row`)
    await expect(rowsEl.length).toBe(messages.length)
  })
}

const gotoRecordAndEnterValue = (record, attribute, value) => {
  gotoRecords()
  gotoRecord(record)
  unlockRecordEdit()
  enterAttribute(attribute, value)
  // eslint-disable-next-line no-param-reassign
  record[attribute.name] = value
  waitThread()
}

export default () =>
  describe('Validation report', () => {
    gotoValidationReport()
    expectMessages([])

    describe(`Duplicate root entity key`, () => {
      gotoRecordAndEnterValue(record2, cluster_id, '6')
      gotoRecordAndEnterValue(record3, cluster_id, '6')
      gotoValidationReport()
      expectMessages([
        [`Cluster[6] / Cluster id`, 'Duplicate record key'],
        [`Cluster[6] / Cluster id`, 'Duplicate record key'],
      ])
    })

    describe(`Restore root entity keys`, () => {
      gotoRecordAndEnterValue(record3, cluster_id, '3')
      gotoRecordAndEnterValue(record2, cluster_id, '2')
      gotoValidationReport()
      expectMessages([])
    })

    describe(`Duplicate root entity unique attribute`, () => {
      const record1CoordinateValuePrev = record1[cluster_coordinate.name]
      const record2CoordinateValuePrev = record2[cluster_coordinate.name]
      const clusterCoordinateDuplicate = { x: '10', y: '20', srs: '4326' }

      gotoRecordAndEnterValue(record1, cluster_coordinate, clusterCoordinateDuplicate)
      gotoRecordAndEnterValue(record2, cluster_coordinate, clusterCoordinateDuplicate)

      gotoValidationReport()
      expectMessages([
        [`Cluster[1] / Cluster coordinate`, DUPLICATE_VALUE],
        [`Cluster[2] / Cluster coordinate`, DUPLICATE_VALUE],
      ])

      // restore old values
      gotoRecordAndEnterValue(record1, cluster_coordinate, record1CoordinateValuePrev)
      gotoRecordAndEnterValue(record2, cluster_coordinate, record2CoordinateValuePrev)

      gotoValidationReport()
      expectMessages([])
    })

    describe(`Invalidate record ${cluster_id.name} ${record1[cluster_id.name]}`, () => {
      gotoRecords()
      gotoRecord(record1)
      enterAttribute(cluster_id, '')
      gotoFormPage(plot)
      selectForm({ nodeDef: plot, keyNodeDef: plot_id, keyValue: record1[plot_id.name] })
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

    describe(`Verify non relevant nodes becoming relevant and getting validated`, () => {
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
      const clusterIdValue = record1[cluster_id.name]
      const plotIdValue = record1[plot_id.name]

      gotoNode(`Cluster[${clusterIdValue}] / Plot[] / Tree[] / Tree decimal 2`)
      enterAttribute(plot_id, plotIdValue)

      enterAttribute(tree_id, record1.trees[0][tree_id.name], getTreeSelector(0))
      enterAttribute(tree_dec_2, record1.trees[0][tree_dec_2.name], getTreeSelector(0))
      // duplicate species with value of previous tree
      enterAttribute(tree_species, record1.trees[0][tree_species.name], getTreeSelector(1))
      waitThread()

      gotoValidationReport()
      expectMessages([
        [`Cluster[${clusterIdValue}] / Plot[${plotIdValue}] / Tree[1] / Tree Species`, DUPLICATE_VALUE],
        [`Cluster[${clusterIdValue}] / Plot[${plotIdValue}] / Tree[10] / Tree id`, 'Duplicate entity key'],
        [`Cluster[${clusterIdValue}] / Plot[${plotIdValue}] / Tree[10] / Tree Species`, DUPLICATE_VALUE],
        [`Cluster[${clusterIdValue}] / Plot[${plotIdValue}] / Tree[10] / Tree id`, 'Duplicate entity key'],
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
