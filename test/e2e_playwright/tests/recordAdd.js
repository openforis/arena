import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'

import { plot } from '../mock/nodeDefs'
import { records } from '../mock/records'
import { gotoFormPage } from './_formDesigner'
import { gotoHome, gotoRecords } from './_navigation'
import { enterCluster, enterPlot, enterTrees } from './_record'

export default () =>
  describe('Record add', () => {
    gotoRecords()

    describe.each(Array.from(Array(records.length).keys()))(`Add record %s`, (idx) => {
      const record = records[idx]

      test(`Create record`, async () => {
        await Promise.all([
          page.waitForSelector(getSelector(DataTestId.surveyForm.surveyForm)),
          page.waitForNavigation(),
          page.click(getSelector(DataTestId.records.addBtn, 'button')),
        ])
        const errorBadge = await page.$(getSelector(DataTestId.record.errorBadge))
        await expect(await errorBadge.innerText()).toBe('Invalid record')
      })

      enterCluster(record)

      gotoFormPage(plot)

      enterPlot(record)

      enterTrees(record)

      gotoRecords()
    })

    gotoHome()
  })
