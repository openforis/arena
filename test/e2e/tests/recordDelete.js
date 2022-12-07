import { TestId, getSelector } from '../../../webapp/utils/testId'
import { records } from '../mock/records'
import { gotoHome, gotoRecords } from './_navigation'
import { expectNoItems } from './_tables'

export default () =>
  describe('Record delete', () => {
    gotoRecords()

    describe.each(Array.from(Array(records.length).keys().reverse()))(`Delete record %s`, (idx) => {
      test(`Delete record at index ${idx}`, async () => {
        await page.click(getSelector(TestId.records.tableRowDeleteButton(idx)))
        await page.waitForSelector(getSelector(TestId.modal.modal))
        await page.click(TestId.modal.ok)
        await page.waitForNavigation()
      })

      test(`Verify record ${idx} deleted`, async () => {
        if (idx === 0) {
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
