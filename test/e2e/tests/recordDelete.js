import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'
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
          page.waitForSelector(getSelector(DataTestId.surveyForm.surveyForm)),
          page.waitForNavigation(),
          page.click(getSelector(DataTestId.table.row(DataTestId.records.records, 0))),
        ])
      })

      test(`Delete record ${idx}`, async () => {
        await page.click(getSelector(DataTestId.record.deleteBtn, 'button'))
        await Promise.all([page.waitForNavigation(), page.click(DataTestId.modal.ok)])
        await expect(page.url()).toBe(`${BASE_URL}/app/data/records/`)
      })

      test(`Verify record ${idx} deleted`, async () => {
        // await page.waitForResponse('**/records**')
        if (idx === records.length - 1) {
          // last record deleted: no items in table
          await expectNoItems()
        } else {
          const rowsSelector = getSelector(DataTestId.table.rows(DataTestId.records.records))
          await page.waitForSelector(rowsSelector)
          const recordsEl = await page.$$(`${rowsSelector} > div`)
          await expect(recordsEl.length).toBe(records.length - (idx + 1))
        }
      })
    })

    gotoHome()
  })
