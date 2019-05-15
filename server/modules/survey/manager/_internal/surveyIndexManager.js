const R = require('ramda')
const db = require('../../../../db/db')

const CategoryRepository = require('../../../category/repository/categoryRepository')

const SurveyIndex = require('../../index/surveyIndex')

const fetchIndex = async (surveyId, client = db) => {
  const categoryIndex = await _fetchCategoryIndex(surveyId, client)

  return {
    [SurveyIndex.keys.categoryIndex]: categoryIndex
  }
}

const _fetchCategoryIndex = async (surveyId, client = db) => {
  const categoriesIndex = await CategoryRepository.fetchIndex(surveyId, client)
  return R.reduce(
    (accIndex, row) => {

      const categoryUuid = row.category_uuid
      const parentUuid = JSON.stringify(row.parent_uuid)
      const code = row.code
      const itemUuid = row.item_uuid

      if (R.has(categoryUuid, accIndex)) {
        if (R.has(parentUuid, accIndex[categoryUuid])) {
          accIndex[categoryUuid][parentUuid] = {
            ...accIndex[categoryUuid][parentUuid],
            [code]: itemUuid
          }
        } else {
          accIndex[categoryUuid][parentUuid] = { [code]: itemUuid }
        }
      } else {
        accIndex[categoryUuid] = { [parentUuid]: { [code]: itemUuid } }
      }
      return accIndex
    },
    {},
    categoriesIndex
  )
}

module.exports = {
  fetchIndex
}