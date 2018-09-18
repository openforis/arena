const R = require('ramda')

const {
  fetchCodeListById: repFetchCodeListById,
  fetchCodeListLevelsByCodeListId,
  fetchCodeListItemsByCodeListId,
} = require('./codeListRepository')

const fetchCodeListById = async (surveyId, id, draft = false) => {
  const codeList = await repFetchCodeListById(surveyId, id, draft)
  const items = await fetchCodeListItemsByCodeListId(surveyId, id)

  return {
    ...codeList,
    levels: await fetchCodeListLevelsByCodeListId(surveyId, id, draft),
    items: R.reduce((item, items) => R.assoc(item.uuid, item)(items), {}, items)
  }
}

module.exports = {
  fetchCodeListById,
}