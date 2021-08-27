import axios from 'axios'
import * as Category from '@core/survey/category'
import * as StringUtils from '@core/stringUtils'
import { cancelableGetRequest } from '../cancelableRequest'

export const fetchCategories = async ({ surveyId, draft = true, validate = false, search = '' }) => {
  const {
    data: { list: categories },
  } = await axios.get(`/api/survey/${surveyId}/categories`, {
    params: { draft, validate, search },
  })
  return categories
}

export const fetchCategory = async ({ surveyId, categoryUuid, draft = true, validate = true }) => {
  const {
    data: { category },
  } = await axios.get(`/api/survey/${surveyId}/categories/${categoryUuid}`, {
    params: {
      draft,
      validate,
    },
  })
  return category
}

export const fetchCategoryItems = ({ surveyId, categoryUuid, draft = true, parentUuid = null }) =>
  cancelableGetRequest({
    url: `/api/survey/${surveyId}/categories/${categoryUuid}/items`,
    data: { draft, parentUuid },
  })

// CREATE
export const createCategory = async ({ surveyId }) => {
  const {
    data: { category },
  } = await axios.post(`/api/survey/${surveyId}/categories`, Category.newCategory())

  return category
}

// DELETE
export const deleteCategory = async ({ surveyId, categoryUuid }) =>
  axios.delete(`/api/survey/${surveyId}/categories/${categoryUuid}`)

export const deleteCategoryIfEmpty = async ({ surveyId, categoryUuid }) => {
  const category = await fetchCategory({ surveyId, categoryUuid, validate: false })
  const { request: fetchFirstLevelItemsRequest } = fetchCategoryItems({ surveyId, categoryUuid })
  const {
    data: { items: firstLevelItems },
  } = await fetchFirstLevelItemsRequest

  if (
    StringUtils.isBlank(Category.getName(category)) &&
    Category.getLevelsArray(category).length === 1 &&
    Object.values(firstLevelItems).length === 0
  ) {
    await deleteCategory({ surveyId, categoryUuid })
    return true
  }
  return false
}
