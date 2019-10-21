import { setContextSurvey, getContextUser } from '../../testContext';
import { assert } from 'chai';
import { uuidv4 } from '../../../core/uuid';
import SurveyManager from '../../../server/modules/survey/manager/surveyManager';
import Survey from '../../../core/survey/survey';

const testSurvey = {
  name: 'test_survey_' + uuidv4(),
  label: 'Test Survey',
  lang: 'en'
}

export const createSurveyTest = async () => {
  const survey = await SurveyManager.createSurvey(getContextUser(), testSurvey)

  setContextSurvey(survey)

  const surveyInfo = Survey.getSurveyInfo(survey)

  assert.equal(Survey.getName(surveyInfo), testSurvey.name)
  assert.equal(Survey.getLanguage(testSurvey.lang)(surveyInfo), testSurvey.lang)
  assert.equal(Survey.getDefaultLabel(surveyInfo), testSurvey.label)
}

// const publishSurveyTest = async () => {
//   const survey = getContextSurvey()
// }

export default {
  createSurveyTest,
};
