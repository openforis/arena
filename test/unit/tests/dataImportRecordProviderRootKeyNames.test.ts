import type { ArenaRecord, ArenaSurvey, NodeDefType } from '@openforis/arena-core'

import * as RecordStep from '@core/record/recordStep'
import { RecordSummary } from '@core/record/recordSummary'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'
import { DataImportJobRecordProvider } from '@server/modules/dataImport/service/dataImportJob/recordProvider'
import { getContextUser } from '../../integration/config/context'
import * as SB from '../../utils/surveyBuilder'

const { nodeDefType } = NodeDef

const recordUuid = 'existing-record-uuid'

// summary as returned by the records summary query: a key named survey_id is camelized into surveyId,
// which is then overwritten by the numeric survey id; the actual key value is only in keysObj
const newRecordSummary = (keyValue: string) =>
  ({
    uuid: recordUuid,
    cycle: Survey.cycleOneKey,
    step: RecordStep.getDefaultStep(),
    surveyId: 42,
    keysObj: { survey_id: keyValue },
  }) as unknown as ArenaRecord & { [keyProp: string]: unknown }

describe('Data import record provider: root key names clashing with record summary props', () => {
  const user = getContextUser()

  const createSurvey = (keyType: NodeDefType): Promise<ArenaSurvey> =>
    SB.survey(user, SB.entity('survey', SB.attribute('survey_id', keyType).key(), SB.attribute('notes'))).build()

  const fetchRecord = ({ survey, keyValueInSummary, keyValueInRow }) => {
    const [keyDef] = Survey.getNodeDefRootKeys(survey)
    return DataImportJobRecordProvider.fetchOrCreateRecord({
      valuesByDefUuid: { [NodeDef.getUuid(keyDef)]: keyValueInRow },
      context: {
        survey,
        surveyId: 42,
        cycle: Survey.cycleOneKey,
        user,
        insertNewRecords: false,
        recordsSummary: [newRecordSummary(keyValueInSummary)],
      },
      tx: null,
      flushCallback: async () => {},
      // same uuid as the matching summary: the record is not fetched from the DB
      currentRecord: { uuid: recordUuid } as ArenaRecord,
    })
  }

  // text keys are matched with the summary index, date keys with a full scan
  test.each([
    [nodeDefType.text, 'S1', 'S2'],
    [nodeDefType.date, '2024-01-31', '2024-02-01'],
  ])('existing record with a %s key named survey_id is found', async (keyType, keyValue) => {
    const survey = await createSurvey(keyType)
    const { newRecord, record } = await fetchRecord({ survey, keyValueInSummary: keyValue, keyValueInRow: keyValue })
    expect(newRecord).toBe(false)
    expect(record.uuid).toBe(recordUuid)
  })

  test.each([
    [nodeDefType.text, 'S1', 'S2'],
    [nodeDefType.date, '2024-01-31', '2024-02-01'],
  ])('record with a different %s key value is not found', async (keyType, keyValueInSummary, keyValueInRow) => {
    const survey = await createSurvey(keyType)
    await expect(fetchRecord({ survey, keyValueInSummary, keyValueInRow })).rejects.toMatchObject({
      key: Validation.messageKeys.dataImport.recordNotFound,
    })
  })

  test('key value is read from keysObj, not from the (overwritten) camelized prop', async () => {
    const survey = await createSurvey(nodeDefType.text)
    const [keyDef] = Survey.getNodeDefRootKeys(survey)
    expect(RecordSummary.getKeyValueFromKeysObj(keyDef)(newRecordSummary('S1'))).toBe('S1')
    expect(RecordSummary.getKeyValueFromKeysObj(keyDef)({ uuid: recordUuid })).toBeUndefined()
  })
})
