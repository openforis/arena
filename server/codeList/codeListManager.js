const Promise = require('bluebird')
const R = require('ramda')

const {toIndexedObj} = require('../../common/survey/surveyUtils')
const codeListRepository = require('../codeList/codeListRepository')
const codeListValidator = require('../codeList/codeListValidator')

const fetchCodeListsWithLevels = async (surveyId, draft) => {
  const codeListsDb = await codeListRepository.fetchCodeListsBySurveyId(surveyId, draft)

  return await Promise.all(
    codeListsDb.map(async codeList => ({
      ...codeList,
      levels: toIndexedObj(
        await codeListRepository.fetchCodeListLevelsByCodeListId(surveyId, codeList.id, draft),
        'index'
      ),
    }))
  )
}
const assocCodeListValidation = async (codeList, codeListsWithLevels, codeListItems) => ({
  ...codeList,
  validation: await codeListValidator.validateCodeList(codeListsWithLevels, codeList, codeListItems)
})

const fetchCodeListById = async (surveyId, codeListId, draft) => {
  const codeListsWithLevels = await fetchCodeListsWithLevels(surveyId, draft)
  return R.find(R.propEq('id', codeListId))(codeListsWithLevels)
}

const fetchCodeListsBySurveyId = async (surveyId, draft) => {
  const codeListsWithLevels = await fetchCodeListsWithLevels(surveyId, draft)

  return await Promise.all(
    codeListsWithLevels.map(async codeList => {
      const codeListItems = await codeListRepository.fetchCodeListItemsByCodeListId(surveyId, codeList.id, draft)
      return await assocCodeListValidation(codeList, codeListsWithLevels, codeListItems)
    })
  )
}

module.exports = {
  fetchCodeListById,
  fetchCodeListsBySurveyId,
}