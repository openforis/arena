import * as R from 'ramda';
import { expect } from 'chai';
import { getContextUser } from '../testContext';
import { uuidv4 } from '../../core/uuid';
import Survey from '../../core/survey/survey';
import Record from '../../core/record/record';
import ActivityLogger from '../../server/modules/activityLog/activityLogger';
import SurveyManager from '../../server/modules/survey/manager/surveyManager';
import RecordManager from '../../server/modules/record/manager/recordManager';
import * as SB from './utils/surveyBuilder';
import RecordUtils from './utils/recordUtils';

describe('Activity Log Test', async () => {

  it('Activity Log on Survey Creation', async () => {
    const surveyParam = {
      name: 'test_survey_' + uuidv4(),
      label: 'Test Survey',
      lang: 'en'
    }
    const survey = await SurveyManager.createSurvey(getContextUser(), surveyParam)
    const surveyId = Survey.getId(survey)

    const logs = await ActivityLogger.fetchLogs(surveyId)

    expect(logs.length).to.be.at.least(1)

    const surveyCreateLogs = R.filter(
      R.propEq(ActivityLogger.keys.type, ActivityLogger.type.surveyCreate)
    )(logs)

    expect(surveyCreateLogs).to.have.lengthOf(1)

    await SurveyManager.deleteSurvey(surveyId)
  })

  it('Activity Log on Record Creation', async () => {
    const user = getContextUser()

    const survey = await SB.survey(user,
      SB.entity('cluster',
        SB.attribute('cluster_no')
          .key()
      )
    ).buildAndStore()

    const surveyId = Survey.getId(survey)

    const recordToCreate = RecordUtils.newRecord(user)

    const record = await RecordManager.insertRecord(user, surveyId, recordToCreate)

    const logs = await ActivityLogger.fetchLogs(surveyId)
    expect(logs.length).to.be.at.least(1)

    const recordCreateLogs = R.filter(log =>
      R.propEq(ActivityLogger.keys.type, ActivityLogger.type.recordCreate, log) &&
      R.pathEq([ActivityLogger.keys.params, Record.keys.uuid], Record.getUuid(record), log)
    )(logs)

    expect(recordCreateLogs).to.have.lengthOf(1)

    await SurveyManager.deleteSurvey(surveyId)
  })
})
