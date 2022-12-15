import * as R from 'ramda'

import { Objects } from '@openforis/arena-core'

import * as Category from '../category'
import * as NodeDef from '../nodeDef'
import * as SurveyInfo from './surveyInfo'
import * as SurveyNodeDefs from './surveyNodeDefs'

const categories = 'categories'

// ====== READ
export const getCategories = R.pipe(R.prop(categories), R.defaultTo({}))

export const getCategoriesArray = R.pipe(
  getCategories,
  R.values,
  // Sort by name
  R.sort((category1, category2) => {
    const name1 = Category.getName(category1)
    const name2 = Category.getName(category2)
    if (name1 < name2) return -1
    if (name1 > name2) return 1
    return 0
  })
)

export const getCategoryByUuid = (uuid) => R.pipe(getCategories, R.prop(uuid))

export const getCategoryByName = (name) =>
  R.pipe(
    getCategories,
    R.values,
    R.find((category) => Category.getName(category) === name)
  )

export const getSamplingPointDataCategory = getCategoryByName(SurveyInfo.samplingPointDataCategoryName)

export const getSamplingPointDataNodeDefs = (survey) => {
  const samplingPointDataCategory = getSamplingPointDataCategory(survey)
  if (!samplingPointDataCategory) return []

  return SurveyNodeDefs.findDescendants({
    nodeDef: SurveyNodeDefs.getNodeDefRoot(survey),
    filterFn: (nodeDef) => NodeDef.getCategoryUuid(nodeDef) === samplingPointDataCategory.uuid,
  })(survey)
}

// ====== UPDATE
export const assocCategories = (newCategories) => R.assoc(categories, newCategories)

export const assocCategory = (category) => (survey) =>
  Objects.assocPath({ obj: survey, path: [categories, Category.getUuid(category)], value: category })
