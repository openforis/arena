const {toIndexedObj} = require('../../common/survey/surveyUtils')

const {
  fetchCodeListById: repFetchCodeListById,
  fetchCodeListLevelsByCodeListId,
} = require('./codeListRepository')

const fetchCodeListById = async (surveyId, id, draft = false) => {
  const codeList = await repFetchCodeListById(surveyId, id, draft)

  return {
    ...codeList,
    levels: toIndexedObj(await fetchCodeListLevelsByCodeListId(surveyId, id, draft), 'index'),
  }
}

module.exports = {
  fetchCodeListById,
}