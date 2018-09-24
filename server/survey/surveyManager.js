const Promise = require('bluebird')

const {
  toIndexedObj,
  toUUIDIndexedObj,
} = require('../../common/survey/surveyUtils')

const {getSurveyById} = require('../survey/surveyRepository')
const {validateSurvey} = require('../survey/surveyValidator')

const {
  fetchCodeListsBySurveyId,
  fetchCodeListLevelsByCodeListId,
} = require('../codeList/codeListRepository')

const fetchSurveyById = async (id, draft) => {
  const survey = await getSurveyById(id, draft)

  const codeListsDb = await fetchCodeListsBySurveyId(id, draft)
  const codeLists = await Promise.all(
    codeListsDb.map(async codeList => ({
      ...codeList,
      levels: toIndexedObj(await fetchCodeListLevelsByCodeListId(survey.id, codeList.id, draft), 'index')
    }))
  )

  return {
    ...survey,
    codeLists: toUUIDIndexedObj(codeLists),
    validation: await validateSurvey(survey),
  }
}

module.exports = {
  fetchSurveyById,
}