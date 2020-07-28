import axios from 'axios'
import * as Category from '@core/survey/category'

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

export const fetchCategoryItems = async ({ surveyId, categoryUuid, draft = true, parentUuid = null }) => {
  const {
    data: { items },
  } = await axios.get(`/api/survey/${surveyId}/categories/${categoryUuid}/items`, {
    params: { draft, parentUuid },
  })
  return items
}

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
