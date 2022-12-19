import * as R from 'ramda'

const keys = {
  collectSurveyFileZip: 'collectSurveyFileZip',
  survey: 'survey',
}

// ===== READ

export const getCollectSurveyFileZip = R.prop(keys.collectSurveyFileZip)

export const getSurvey = R.prop(keys.survey)

// ===== UPDATE

export const assocSurvey = R.assoc(keys.survey)
