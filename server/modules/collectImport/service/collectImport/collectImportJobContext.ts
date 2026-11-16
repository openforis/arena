import * as A from '@core/arena'

const keys = {
  collectSurveyFileZip: 'collectSurveyFileZip',
  survey: 'survey',
}

// ===== READ

export const getCollectSurveyFileZip = A.prop(keys.collectSurveyFileZip)

export const getSurvey = A.prop(keys.survey)

// ===== UPDATE

export const assocSurvey = A.assoc(keys.survey)
