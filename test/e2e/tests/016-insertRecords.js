import { reload, waitFor } from '../utils/api'
import { records } from '../resources/records/recordsData'

import { insertRecord, checkRecord } from '../utils/ui/nodeDefs'
import { clickSiderbarBtnDataRecords } from '../utils/ui/sidebar'

describe('Survey insert records', () => {
  test('Open records', async () => {
    await reload()
    await waitFor(2000)
    await clickSiderbarBtnDataRecords()
    await waitFor(5000)
  })

  test.each(records.map((record, idx) => [record, idx]))(
    'Enter record',
    async (record) => {
      await waitFor(2000)
      await clickSiderbarBtnDataRecords()
      await waitFor(500)
      await insertRecord(record)
    },
    120000 * records.length
  )

  test.each(records.reverse().map((record, idx) => [record, idx + 1]))(
    'Check record',
    async (record, index) => {
      await waitFor(2000)
      await clickSiderbarBtnDataRecords()
      await waitFor(500)
      await checkRecord(record, index)
    },
    120000 * records.length
  )
})
