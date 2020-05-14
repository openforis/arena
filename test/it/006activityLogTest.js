import * as R from 'ramda'
import { expect } from 'chai'

import { uuidv4 } from '../../core/uuid'
import * as Survey from '../../core/survey/survey'
import * as Record from '../../core/record/record'
import * as User from '../../core/user/user'
import * as ObjectUtils from '../../core/objectUtils'

import * as ActivityLog from '../../common/activityLog/activityLog'

import * as ActivityLogRepository from '../../server/modules/activityLog/repository/activityLogRepository'
import * as SurveyManager from '../../server/modules/survey/manager/surveyManager'
import * as RecordManager from '../../server/modules/record/manager/recordManager'
import { getContextUser } from '../testContext'

import * as SB from './utils/surveyBuilder'
import * as RecordUtils from './utils/recordUtils'

describe('Activity Log Test', () => {
  it('Activity Log on Survey Creation', async () => {
    const user = getContextUser()
    const surveyInfo = Survey.newSurvey({
      ownerUuid: User.getUuid(user),
      name: `do_not_use__test_survey_${uuidv4()}`,
      label: 'DO NOT USE! Test Survey',
      languages: ['en'],
    })
    const survey = await SurveyManager.insertSurvey({ user, surveyInfo })
    const surveyId = Survey.getId(survey)

    const surveyCreateLogs = await ActivityLogRepository.fetch(Survey.getSurveyInfo(survey), [
      ActivityLog.type.surveyCreate,
    ])

    expect(surveyCreateLogs).to.have.lengthOf(1)

    await SurveyManager.deleteSurvey(surveyId)
  })

  it('Activity Log on Record Creation', async () => {
    const user = getContextUser()

    const survey = await SB.survey(user, SB.entity('cluster', SB.attribute('cluster_no').key())).buildAndStore()

    const surveyId = Survey.getId(survey)

    const recordToCreate = RecordUtils.newRecord(user)

    const record = await RecordManager.insertRecord(user, surveyId, recordToCreate)

    const logs = await ActivityLogRepository.fetch(Survey.getSurveyInfo(survey), [ActivityLog.type.recordCreate])
    expect(logs.length).to.be.at.least(1)

    const recordCreateLogs = R.filter(
      (activity) => ObjectUtils.getUuid(ActivityLog.getContent(activity)) === Record.getUuid(record)
    )(logs)

    expect(recordCreateLogs).to.have.lengthOf(1)

    await SurveyManager.deleteSurvey(surveyId)
  })
})
