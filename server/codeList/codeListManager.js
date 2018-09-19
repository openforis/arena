const {
  fetchCodeListById: repFetchCodeListById,
  fetchCodeListLevelsByCodeListId,
} = require('./codeListRepository')

const fetchCodeListById = async (surveyId, id, draft = false) => {
  const codeList = await repFetchCodeListById(surveyId, id, draft)

  return {
    ...codeList,
    levels: await fetchCodeListLevelsByCodeListId(surveyId, id, draft),
  }
}

module.exports = {
  fetchCodeListById,
}