import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'

import { cluster, plot } from '../mock/nodeDefs'
import { records } from '../mock/records'
import { gotoFormPage } from './_formDesigner'
import { gotoHome, gotoRecords } from './_navigation'
import { verifyCluster, verifyPlot, verifyTrees } from './_record'

/* eslint-disable camelcase */
const { cluster_id } = cluster.children

export default () =>
  describe('Record verify', () => {
    describe.each(Array.from(Array(records.length).keys()))(`Verify record %s`, (idx) => {
      const record = records[idx]

      gotoRecords()

      test(`Goto record`, async () => {
        const clusterIdName = cluster_id.name
        const clusterId = record[clusterIdName]
        const cellSelector = `${getSelector(DataTestId.records.cellNodeDef(clusterIdName))}[data-value="${clusterId}"]`
        await Promise.all([
          page.waitForSelector(getSelector(DataTestId.surveyForm.surveyForm)),
          page.waitForNavigation(),
          page.click(cellSelector),
        ])
        const errorBadge = await page.$(getSelector(DataTestId.record.errorBadge))
        await expect(errorBadge).toBeNull()
      })

      verifyCluster(record)

      gotoFormPage(plot)

      verifyPlot(record)

      verifyTrees(record)

      test('Wait thread to complete', async () => {
        // TODO thread issue: https://github.com/openforis/arena/issues/1412
        await page.waitForTimeout(500)
      })
    })

    gotoHome()
  })
