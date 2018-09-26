const Promise = require('bluebird')
const R = require('ramda')

const {
  toIndexedObj,
  toUUIDIndexedObj,
} = require('../../common/survey/surveyUtils')

const {getSurveyById} = require('../survey/surveyRepository')
const {validateSurvey} = require('../survey/surveyValidator')

const {
  fetchCodeListsBySurveyId,
  fetchCodeListLevelsByCodeListId,
  fetchCodeListItemsByCodeListId,
} = require('../codeList/codeListRepository')
const {
  validateCodeList
} = require('../codeList/codeListValidator')

const fetchCodeListsWithLevels = async (surveyId, draft) => {
  const codeListsDb = await fetchCodeListsBySurveyId(surveyId, draft)

  return await Promise.all(
    codeListsDb.map(async codeList => ({
      ...codeList,
      levels: toIndexedObj(await fetchCodeListLevelsByCodeListId(surveyId, codeList.id, draft), 'index'),
    }))
  )
}

const assocCodeListValidation = async (codeList, codeListsWithLevels, codeListItems) => ({
  ...codeList,
  validation: await validateCodeList(codeListsWithLevels, codeList, codeListItems)
})

const fetchCodeListById = async (surveyId, codeListId, draft, validate = false) => {
  const codeListsWithLevels = await fetchCodeListsWithLevels(surveyId, draft)
  const codeList = R.find(R.propEq('id', codeListId))(codeListsWithLevels)

  if (validate) {
    const items = await fetchCodeListItemsByCodeListId(surveyId, codeList.id, draft)
    return await assocCodeListValidation(codeList, codeListsWithLevels, items)
  } else {
    return codeList
  }
}

const fetchCodeLists = async (surveyId, draft) => {
  const codeListsWithLevels = await fetchCodeListsWithLevels(surveyId, draft)

  return await Promise.all(
    codeListsWithLevels.map(async codeList => {
      const codeListItems = await fetchCodeListItemsByCodeListId(surveyId, codeList.id, draft)
      return await assocCodeListValidation(codeList, codeListsWithLevels, codeListItems)
    })
  )
}

const fetchSurveyById = async (id, draft) => {
  const survey = await getSurveyById(id, draft)
  const codeLists = await fetchCodeLists(id, draft)

  return {
    ...survey,
    codeLists: toUUIDIndexedObj(codeLists),
    validation: await validateSurvey(survey),
  }
}

module.exports = {
  fetchSurveyById,
  fetchCodeListById,
}