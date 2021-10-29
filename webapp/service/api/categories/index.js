import axios from 'axios'

import * as Category from '@core/survey/category'
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

export const startExportAllCategoriesJob = async ({ surveyId, draft = true }) => {
  const {
    data: { job },
  } = await axios.post(`/api/survey/${surveyId}/categories/export`, { draft })

  return { job }
}

// CREATE
export const createCategory = async ({ surveyId }) => {
  const {
    data: { category },
  } = await axios.post(`/api/survey/${surveyId}/categories`, Category.newCategory())

  return category
}

// UPDATE
export const cleanupCategory = async ({ surveyId, categoryUuid }) => {
  const {
    data: { deleted, updated },
  } = await axios.put(`/api/survey/${surveyId}/categories/${categoryUuid}/cleanup`)

  return { deleted, updated }
}

// DELETE
export const deleteCategory = async ({ surveyId, categoryUuid }) =>
  axios.delete(`/api/survey/${surveyId}/categories/${categoryUuid}`)
