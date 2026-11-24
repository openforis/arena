import * as A from '@core/arena'

import { uuidv4 } from '../../../core/uuid'
import * as Survey from '../../../core/survey/survey'
import * as Record from '../../../core/record/record'
import * as User from '../../../core/user/user'
import * as ObjectUtils from '../../../core/objectUtils'

import * as ActivityLog from '../../../common/activityLog/activityLog'

import * as ActivityLogRepository from '../../../server/modules/activityLog/repository/activityLogRepository'
import * as SurveyManager from '../../../server/modules/survey/manager/surveyManager'
import * as RecordManager from '../../../server/modules/record/manager/recordManager'
import { getContextUser } from '../config/context'

import * as SB from '../../utils/surveyBuilder'
import * as RecordUtils from '../../utils/recordUtils'

describe('Activity Log Test', () => {
  test('Activity Log on Survey Creation', async () => {
    const user = getContextUser()
    const surveyInfo = Survey.newSurvey({
      ownerUuid: User.getUuid(user),
      name: `do_not_use__test_survey_${uuidv4()}`,
      label: 'DO NOT USE! Test Survey',
      languages: ['en'],
    })
    const survey = await SurveyManager.insertSurvey({ user, surveyInfo })
    const surveyId = Survey.getId(survey)

    const surveyCreateLogs = await ActivityLogRepository.fetch({
      surveyInfo: Survey.getSurveyInfo(survey),
      activityTypes: [ActivityLog.type.surveyCreate],
    })

    expect(surveyCreateLogs).toHaveLength(1)

    await SurveyManager.deleteSurvey(surveyId)
  })

  test('Activity Log on Record Creation', async () => {
    const user = getContextUser()

    const survey = await SB.survey(user, SB.entity('cluster', SB.attribute('cluster_no').key())).buildAndStore()

    const surveyId = Survey.getId(survey)

    const recordToCreate = RecordUtils.newRecord(user)

    const record = await RecordManager.insertRecord(user, surveyId, recordToCreate)

    const logs = await ActivityLogRepository.fetch({
      surveyInfo: Survey.getSurveyInfo(survey),
      activityTypes: [ActivityLog.type.recordCreate],
    })
    expect(logs.length).toBeGreaterThanOrEqual(1)

    const recordCreateLogs = A.filter(
      (activity) => ObjectUtils.getUuid(ActivityLog.getContent(activity)) === Record.getUuid(record)
    )(logs)

    expect(recordCreateLogs).toHaveLength(1)

    await SurveyManager.deleteSurvey(surveyId)
  })

  test('Activity Log fetch filtered by id', async () => {
    const user = getContextUser()

    const survey = await SB.survey(user, SB.entity('cluster', SB.attribute('cluster_no').key())).buildAndStore()
    const surveyId = Survey.getId(survey)
    const surveyInfo = Survey.getSurveyInfo(survey)

    await RecordManager.insertRecord(user, surveyId, RecordUtils.newRecord(user))
    await RecordManager.insertRecord(user, surveyId, RecordUtils.newRecord(user))

    const getIds = (logs) => logs.map((log) => Number(ActivityLog.getId(log)))

    const allIds = getIds(await ActivityLogRepository.fetch({ surveyInfo }))
    expect(allIds.length).toBeGreaterThanOrEqual(2)
    const minId = Math.min(...allIds)
    const maxId = Math.max(...allIds)

    const olderIds = getIds(await ActivityLogRepository.fetch({ surveyInfo, idLessThan: maxId }))
    expect(olderIds.length).toBeGreaterThan(0)
    expect(olderIds.every((id) => id < maxId)).toBe(true)

    const newerIds = getIds(await ActivityLogRepository.fetch({ surveyInfo, idGreaterThan: minId, orderBy: 'ASC' }))
    expect(newerIds.length).toBeGreaterThan(0)
    expect(newerIds.every((id) => id > minId)).toBe(true)
    expect(newerIds).toEqual([...newerIds].sort((idA, idB) => idA - idB))

    await SurveyManager.deleteSurvey(surveyId)
  })
})
