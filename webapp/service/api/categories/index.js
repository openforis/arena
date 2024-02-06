import axios from 'axios'

import * as A from '@core/arena'
import * as Category from '@core/survey/category'
import { cancelableGetRequest } from '../cancelableRequest'
import { objectToFormData } from '../utils/apiUtils'

// READ
export const fetchCategories = async ({ surveyId, draft = true, validate = false, search = '' }) => {
  const {
    data: { list: categories },
  } = await axios.get(`/api/survey/${surveyId}/categories`, {
    params: { draft, validate, search },
  })
  return categories
}

export const fetchItemsCountIndexedByCategoryUuid = async ({ surveyId, draft = true, search = '' }) => {
  const { data } = await axios.get(`/api/survey/${surveyId}/categories/items-count`, {
    params: { draft, search },
  })
  return data
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

export const fetchCategoryItems = ({
  surveyId,
  categoryUuid,
  draft = true,
  parentUuid = null,
  search = null,
  lang = null,
}) =>
  cancelableGetRequest({
    url: `/api/survey/${surveyId}/categories/${categoryUuid}/items`,
    data: { draft, parentUuid, search, lang },
  })

export const fetchCategoryItemsInLevelRequest = ({ surveyId, categoryUuid, levelIndex, draft = true }) =>
  cancelableGetRequest({
    url: `/api/survey/${surveyId}/categories/${categoryUuid}/levels/${levelIndex}/items`,
    data: { draft },
  })

export const countSamplingPointData = ({ surveyId, levelIndex = 0 }) =>
  cancelableGetRequest({
    url: `/api/survey/${surveyId}/sampling-point-data/count`,
    data: { levelIndex },
  })

export const fetchSamplingPointData = ({ surveyId, levelIndex = 0, limit = 500, offset = 0 }) =>
  cancelableGetRequest({
    url: `/api/survey/${surveyId}/sampling-point-data`,
    data: { levelIndex, limit, offset },
  })

export const startExportAllCategoriesJob = async ({ surveyId, draft = true }) => {
  const {
    data: { job },
  } = await axios.post(`/api/survey/${surveyId}/categories/export`, { draft })

  return { job }
}

export const startCategoriesBatchImportJob = async ({ surveyId, file }) => {
  const formData = objectToFormData({ file })
  const {
    data: { job },
  } = await axios.post(`/api/survey/${surveyId}/categories/import`, formData)
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
export const updateCategoryProp = async ({ surveyId, categoryUuid, key, value }) => {
  const {
    data: { category },
  } = await axios.put(`/api/survey/${surveyId}/categories/${categoryUuid}`, { key, value })

  return category
}

export const updateCategoryItemExtraDefItem = async ({
  surveyId,
  categoryUuid,
  name,
  itemExtraDef = null,
  deleted = false,
}) => {
  const {
    data: { category },
  } = await axios.put(`/api/survey/${surveyId}/categories/${categoryUuid}/extradef`, {
    name,
    itemExtraDef: A.stringify(itemExtraDef),
    deleted,
  })

  return category
}

export const cleanupCategory = async ({ surveyId, categoryUuid }) => {
  const {
    data: { deleted, updated },
  } = await axios.put(`/api/survey/${surveyId}/categories/${categoryUuid}/cleanup`)

  return { deleted, updated }
}

export const convertToReportingDataCategory = async ({ surveyId, categoryUuid }) => {
  const {
    data: { category },
  } = await axios.put(`/api/survey/${surveyId}/categories/${categoryUuid}/convertToReportingData`)

  return category
}

// DELETE
export const deleteCategory = async ({ surveyId, categoryUuid }) =>
  axios.delete(`/api/survey/${surveyId}/categories/${categoryUuid}`)
