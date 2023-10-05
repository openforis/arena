import { TestId, getSelector } from '../../../webapp/utils/testId'

import { plot } from '../mock/nodeDefs'
import { records } from '../mock/records'
import { gotoFormPage } from './_formDesigner'
import { gotoHome, gotoRecords } from './_navigation'
import { enterCluster, enterPlot, enterTrees } from './_record'

export default () =>
  describe('Record add', () => {
    describe.each(Array.from(Array(records.length).keys()))(`Add record %s`, (idx) => {
      const record = records[idx]

      gotoRecords()

      test(`Create record`, async () => {
        await Promise.all([
          page.waitForSelector(getSelector(TestId.surveyForm.surveyForm)),
          page.waitForNavigation(),
          page.click(getSelector(TestId.records.addBtn, 'button')),
        ])
        const invalidRecordBtn = await page.waitForSelector(getSelector(TestId.record.invalidBtn))
        await expect(invalidRecordBtn).not.toBeNull()
      })

      enterCluster(record)

      gotoFormPage(plot)

      enterPlot(record)

      enterTrees(record)

      test('Wait thread to complete', async () => {
        // TODO thread issue: https://github.com/openforis/arena/issues/1412
        await page.waitForTimeout(2000)
      })
    })

    gotoHome()
  })
