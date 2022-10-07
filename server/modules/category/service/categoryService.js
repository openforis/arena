import { Points } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'

import * as JobManager from '@server/job/jobManager'
import * as Response from '@server/utils/response'
import * as CSVWriter from '@server/utils/file/csvWriter'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import * as CategoryImportJobParams from './categoryImportJobParams'
import CategoryImportJob from './categoryImportJob'
import CategoriesExportJob from './CategoriesExportJob'
import * as CategoryManager from '../manager/categoryManager'
import { CategoryImportTemplateGenerator } from '../manager/categoryImportTemplateGenerator'

export const importCategory = (user, surveyId, categoryUuid, summary) => {
  const job = new CategoryImportJob({
    user,
    surveyId,
    [CategoryImportJobParams.keys.categoryUuid]: categoryUuid,
    [CategoryImportJobParams.keys.summary]: summary,
  })

  JobManager.executeJobThread(job)

  return job
}

export const exportCategory = async ({ surveyId, categoryUuid, draft, res }) => {
  const category = await CategoryManager.fetchCategoryAndLevelsByUuid({ surveyId, categoryUuid, draft })
  const fileName = `${Category.getName(category) || 'category'}.csv`
  Response.setContentTypeFile({ res, fileName, contentType: Response.contentTypes.csv })

  await CategoryManager.exportCategoryToStream({ surveyId, categoryUuid, draft, outputStream: res })
}

export const exportCategoryImportTemplateGeneric = async ({ surveyId, draft, res }) => {
  const survey = await SurveyManager.fetchSurveyById({ surveyId, draft })
  const languages = Survey.getLanguages(Survey.getSurveyInfo(survey))

  const templateData = CategoryImportTemplateGenerator.generateTemplate({ languages })
  const fileName = 'category_import_template.csv'
  Response.setContentTypeFile({ res, fileName, contentType: Response.contentTypes.csv })

  await CSVWriter.writeToStream(res, templateData)
}

export const exportCategoryImportTemplate = async ({ surveyId, categoryUuid, draft, res }) => {
  const category = await CategoryManager.fetchCategoryAndLevelsByUuid({ surveyId, categoryUuid, draft })
  const survey = await SurveyManager.fetchSurveyById({ surveyId, draft })
  const languages = Survey.getLanguages(Survey.getSurveyInfo(survey))

  const templateData = CategoryImportTemplateGenerator.generateTemplate({ category, languages })
  const fileName = `${Category.getName(category) || 'category'}_import_template.csv`

  Response.setContentTypeFile({ res, fileName, contentType: Response.contentTypes.csv })

  await CSVWriter.writeToStream(res, templateData)
}

export const exportAllCategories = ({ user, surveyId, draft }) => {
  const job = new CategoriesExportJob({
    user,
    surveyId,
    draft,
  })

  JobManager.executeJobThread(job)

  return job
}

const _getSamplingPointDataCategory = async ({ surveyId }) => {
  const draft = true
  const categories = await CategoryManager.fetchCategoriesBySurveyId({ surveyId, draft })
  return categories.find((category) => Category.getName(category) === Survey.samplingPointDataCategoryName)
}

export const countSamplingPointData = async ({ surveyId, levelIndex = 0 }) => {
  const category = await _getSamplingPointDataCategory({ surveyId })
  const categoryUuid = Category.getUuid(category)
  const count = await CategoryManager.countItemsByLevelIndex({ surveyId, categoryUuid, levelIndex })
  return count
}

export const fetchSamplingPointData = async ({ surveyId, levelIndex = 0, limit, offset }) => {
  const draft = true
  const category = await _getSamplingPointDataCategory({ surveyId })
  const items = await CategoryManager.fetchItemsByLevelIndex({
    surveyId,
    categoryUuid: Category.getUuid(category),
    levelIndex,
    limit,
    offset,
    draft,
  })
  const samplingPointData = items.map((item) => {
    const location = CategoryItem.getExtraProp('location')(item)
    const ancestorCodes = CategoryItem.getAncestorCodes(item)
    const point = Points.parse(location)
    const pointLatLong = Points.toLatLong(point)
    return {
      uuid: CategoryItem.getUuid(item),
      codes: [...ancestorCodes, CategoryItem.getCode(item)],
      latLng: [pointLatLong.y, pointLatLong.x],
      location,
    }
  })
  return samplingPointData
}

export const fetchCategoryItemsSummary = async ({ surveyId, categoryUuid, language, draft = false }) => {
  const category = await fetchCategoryAndLevelsByUuid({ surveyId, categoryUuid, draft })
  const extraDefKeys = Category.getItemExtraDefKeys(category)
  const levels = Category.getLevelsArray(category)
  const hierarchical = levels.length > 1
  const items = await fetchItemsByCategoryUuid({ surveyId, categoryUuid, draft })

  if (hierarchical) {
    // iterate only one time the items to get children and parent for every item
    items.forEach((item) => {
      const children = items.filter((itm) => CategoryItem.getParentUuid(itm) === CategoryItem.getUuid(item))
      children.forEach((child) => (child.parent = item))
      item.children = children
    })
  }

  if (Category.isReportingData(category)) {
    // calculate cumulative area for each item
    // if item is leaf, cumulative area = area
    // otherwise it's the sum of the cumulative areas of the children
    const calculateCumulativeArea = (item) => {
      if (!isNaN(item.areaCumulative)) {
        return item.areaCumulative
      }
      if (Category.isItemLeaf(item)(category)) {
        return Number(CategoryItem.getExtraProp('area')(item)) || 0
      }
      return item.children.reduce((totalArea, childItem) => totalArea + calculateCumulativeArea(childItem), 0)
    }
    items.forEach((item) => {
      item.areaCumulative = calculateCumulativeArea(item)
    })
  }

  const getAncestorItem = ({ item, levelIndex }) => {
    const { parent } = item
    if (levelIndex === Category.getItemLevelIndex(item)(category) - 1) {
      return parent
    }
    return getAncestorItem({ item: parent, levelIndex })
  }

  const getAncestorItemCode = ({ item, levelIndex }) => {
    const itemLevelIndex = Category.getItemLevelIndex(item)(category)
    if (itemLevelIndex === levelIndex) {
      return CategoryItem.getCode(item)
    }
    if (itemLevelIndex > levelIndex) {
      return CategoryItem.getCode(getAncestorItem({ item, levelIndex }))
    }
    return null
  }

  return items.map((item) => ({
    code: CategoryItem.getCode(item),
    ...(hierarchical
      ? {
          level: Category.getItemLevelIndex(item)(category) + 1,
          ...levels.reduce(
            (acc, _level, levelIndex) => ({
              ...acc,
              [`level_${levelIndex + 1}_code`]: getAncestorItemCode({ item, levelIndex }),
            }),
            {}
          ),
        }
      : {}),
    label: CategoryItem.getLabel(language)(item),
    ...extraDefKeys.reduce(
      (acc, extraDefKey) => ({ ...acc, [extraDefKey]: CategoryItem.getExtraProp(extraDefKey)(item) }),
      {}
    ),
    ...(Category.isReportingData(category)
      ? {
          area_cumulative: item.areaCumulative,
        }
      : {}),
  }))
}

export const {
  insertCategory,
  createImportSummary,
  createImportSummaryFromStream,
  insertLevel,
  insertItem,
  insertItems,

  insertItemsInBatch,

  countCategories,
  fetchCategoriesBySurveyId,
  fetchCategoriesAndLevelsBySurveyId,
  fetchCategoryAndLevelsByUuid,
  fetchItemsByParentUuid,
  fetchItemsByCategoryUuid,
  countItemsByLevelIndex,
  fetchItemsByLevelIndex,

  updateCategoryProp,
  updateCategoryItemExtraDefItem,
  cleanupCategory,
  convertCategoryToReportingData,
  updateLevelProp,
  updateItemProp,

  deleteCategory,
  deleteLevel,
  deleteItem,
} = CategoryManager
