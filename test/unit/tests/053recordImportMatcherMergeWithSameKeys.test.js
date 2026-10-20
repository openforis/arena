import { SurveySecurityProp } from '@openforis/arena-core'

import { ConflictResolutionStrategy } from '@common/dataImport'
import { RecordImportAction } from '@common/dataImport/recordImportAction'

import * as Record from '@core/record/record'
import * as Survey from '@core/survey/survey'

import { determineRecordAction } from '@server/modules/dataImport/service/DataImportJob/recordImportMatcher'

import * as DataTest from '../../utils/dataTest'
import * as RB from '../../utils/recordBuilder'

import { getContextUser } from '../../integration/config/context'

const assocSecurity = (security) => (survey) => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  const surveyInfoUpdated = { ...surveyInfo, props: { ...surveyInfo.props, security } }
  return survey.info ? { ...survey, info: surveyInfoUpdated } : { ...survey, ...surveyInfoUpdated }
}

describe('Record import matcher: merge of records with same keys', () => {
  let survey = null
  let record = null

  const createRecordSummary = ({ uuid = Record.getUuid(record) } = {}) => ({
    [Record.keys.uuid]: uuid,
    [Record.keys.dateModified]: Record.getDateModified(record),
  })

  const determineMergeAction = ({ survey: surveyParam = survey, existingRecordSummary }) =>
    determineRecordAction({
      survey: surveyParam,
      record,
      existingRecordSummary,
      conflictResolutionStrategy: ConflictResolutionStrategy.merge,
    })

  const surveyWithMergeNotAllowed = () =>
    assocSecurity({ [SurveySecurityProp.allowRecordsMergeWithSameKeys]: false })(survey)

  beforeAll(async () => {
    const user = getContextUser()
    survey = await DataTest.createTestSurvey({ user })
    record = RB.record(user, survey, RB.entity('cluster', RB.attribute('cluster_id', 1))).build()
  })

  test('merge into a record with same keys is allowed by default', () => {
    const existingRecordSummary = createRecordSummary({ uuid: 'other-record-uuid' })
    const { action, existingRecordUuid } = determineMergeAction({ existingRecordSummary })
    expect(action).toBe(RecordImportAction.merge)
    expect(existingRecordUuid).toBe('other-record-uuid')
  })

  test('merge into a record with same keys is blocked when not allowed', () => {
    const existingRecordSummary = createRecordSummary({ uuid: 'other-record-uuid' })
    expect(() => determineMergeAction({ survey: surveyWithMergeNotAllowed(), existingRecordSummary })).toThrow(
      'dataImport.recordMergeWithSameKeysNotAllowed'
    )
  })

  test('merge with the same record (same uuid) is allowed even when merging records with same keys is not', () => {
    const existingRecordSummary = createRecordSummary()
    const { action } = determineMergeAction({ survey: surveyWithMergeNotAllowed(), existingRecordSummary })
    expect(action).toBe(RecordImportAction.merge)
  })

  test('new records are inserted when merging records with same keys is not allowed', () => {
    const { action } = determineMergeAction({ survey: surveyWithMergeNotAllowed(), existingRecordSummary: null })
    expect(action).toBe(RecordImportAction.insert)
  })
})
