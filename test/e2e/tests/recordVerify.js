import { expect, test } from '@playwright/test'

import { TestId, getSelector } from '../../../webapp/utils/testId'

import { plot } from '../mock/nodeDefs'
import { records } from '../mock/records'
import { gotoFormPage, selectForm } from './_formDesigner'
import { gotoHome, gotoRecords } from './_navigation'
import { verifyCluster, verifyPlot, verifyTrees } from './_record'
import { gotoRecord } from './_records'

const { plot_id } = plot.children

export default () =>
  test.describe('Record verify', () => {
    describe.each(Array.from(Array(records.length).keys()))(`Verify record %s`, (idx) => {
      const record = records[idx]

      gotoRecords()

      gotoRecord(record)

      test(`Verify record valid`, async () => {
        const invalidRecordBtn = await page.$(getSelector(TestId.record.invalidBtn))
        await expect(invalidRecordBtn).toBeNull()
      })

      verifyCluster(record)

      gotoFormPage(plot)

      selectForm({ nodeDef: plot, keyNodeDef: plot_id, keyValue: record[plot_id.name] })

      verifyPlot(record)

      verifyTrees(record)

      test('Wait thread to complete', async () => {
        // TODO thread issue: https://github.com/openforis/arena/issues/1412
        await page.waitForTimeout(500)
      })
    })

    gotoHome()
  })
