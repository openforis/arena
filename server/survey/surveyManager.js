const R = require('ramda')

const {getSurveyById} = require('../survey/surveyRepository')
const {validateSurvey} = require('../survey/surveyValidator')
const {fetchCodeListsBySurveyId} = require('../codeList/codeListRepository')

const fetchSurveyById = async (id, draft) => {
  const survey = await getSurveyById(id, draft)

  return {
    ...survey,
    codeLists: R.reduce((lists, list) => R.assoc(list.uuid, list, lists), {}, await fetchCodeListsBySurveyId(id, draft)),
    validation: await validateSurvey(survey),
  }
}

module.exports = {
  fetchSurveyById,
}