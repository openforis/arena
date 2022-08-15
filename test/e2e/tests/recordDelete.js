import { TestId, getSelector } from '../../../webapp/utils/testId'
import { records } from '../mock/records'
import { gotoHome, gotoRecords } from './_navigation'
import { BASE_URL } from '../config'
import { expectNoItems } from './_tables'

export default () =>
  describe('Record delete', () => {
    gotoRecords()

    describe.each(Array.from(Array(records.length).keys()))(`Delete record %s`, (idx) => {
      test(`Goto record ${idx}`, async () => {
        // go to record
        await Promise.all([
          page.waitForSelector(getSelector(TestId.surveyForm.surveyForm)),
          page.waitForNavigation(),
          page.dblclick(getSelector(TestId.table.row(TestId.records.tableModule, 0))),
        ])
      })

      test(`Delete record ${idx}`, async () => {
        await page.click(getSelector(TestId.record.deleteBtn, 'button'))
        await Promise.all([page.waitForNavigation(), page.click(TestId.modal.ok)])
        await expect(page.url()).toBe(`${BASE_URL}/app/data/records/`)
      })

      test(`Verify record ${idx} deleted`, async () => {
        if (idx === records.length - 1) {
          // last record deleted: no items in table
          await expectNoItems()
        } else {
          const rowsSelector = getSelector(TestId.table.rows(TestId.records.tableModule))
          await page.waitForSelector(rowsSelector)
          const recordsEl = await page.$$(`${rowsSelector} > div`)
          await expect(recordsEl.length).toBe(records.length - (idx + 1))
        }
      })
    })

    gotoHome()
  })
