import type { ArenaRecord, NodeDefType } from '@openforis/arena-core'

import { ConflictResolutionStrategy } from '@common/dataImport'
import * as NodeDef from '@core/survey/nodeDef'
import { findExistingRecordSummary } from '@server/modules/dataImport/service/dataImportJob/recordImportMatcher'
import { getContextUser } from '../../integration/config/context'
import * as RB from '../../utils/recordBuilder'
import * as SB from '../../utils/surveyBuilder'

const { nodeDefType } = NodeDef

const existingRecordUuid = 'existing-record-uuid'

// summary as returned by the records summary query: a key named survey_id is camelized into surveyId,
// which is then overwritten by the numeric survey id; the actual key value is only in keysObj (as a JSON value)
const newRecordSummary = (keyValueInSummary: unknown) =>
  ({ uuid: existingRecordUuid, surveyId: 42, keysObj: { survey_id: keyValueInSummary } }) as unknown as ArenaRecord & {
    [keyProp: string]: unknown
  }

describe('Record import matcher: root key named survey_id (merge by keys)', () => {
  const user = getContextUser()

  const findExisting = async ({ keyType, keyValueInRecord, keyValueInSummary }) => {
    const survey = await SB.survey(
      user,
      SB.entity('survey', SB.attribute('survey_id', keyType as NodeDefType).key(), SB.attribute('notes'))
    ).build()
    const record = RB.record(user, survey, RB.entity('survey', RB.attribute('survey_id', keyValueInRecord))).build()
    return findExistingRecordSummary({
      survey,
      record,
      existingRecordsSummary: [newRecordSummary(keyValueInSummary)],
      conflictResolutionStrategy: ConflictResolutionStrategy.merge,
    })
  }

  test.each([
    [nodeDefType.text, 'S1', 'S1'],
    [nodeDefType.integer, 5, 5],
    [nodeDefType.decimal, 12.5, 12.5],
    [nodeDefType.date, '2024-01-31', '2024-01-31'],
  ])('%s key: the existing record is found', async (keyType, keyValueInRecord, keyValueInSummary) => {
    const existing = await findExisting({ keyType, keyValueInRecord, keyValueInSummary })
    expect(existing?.uuid).toBe(existingRecordUuid)
  })

  test.each([
    [nodeDefType.text, 'S1', 'S2'],
    [nodeDefType.integer, 5, 6],
    [nodeDefType.decimal, 12.5, 12.25],
    [nodeDefType.date, '2024-01-31', '2024-02-01'],
  ])(
    '%s key: a record with a different key value is not matched',
    async (keyType, keyValueInRecord, keyValueInSummary) => {
      const existing = await findExisting({ keyType, keyValueInRecord, keyValueInSummary })
      expect(existing).toBeUndefined()
    }
  )
})
