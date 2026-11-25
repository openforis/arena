import type { ArenaCategory, ArenaSurvey } from '@openforis/arena-core'
import { ArenaAnyNodeDef, Objects, Surveys } from '@openforis/arena-core'

import * as A from '@core/arena'
import { functionNames } from '@core/expressionParser/expression'
import * as Category from '../category'
import * as NodeDef from '../nodeDef'

import * as SurveyNodeDefs from './surveyNodeDefs'

type CategoriesByUuid = Record<string, ArenaCategory>
const categoriesKey = 'categories'

const compareByName = (category1: ArenaCategory, category2: ArenaCategory): number => {
  const name1 = Category.getName(category1)
  const name2 = Category.getName(category2)
  if (name1 < name2) return -1
  if (name1 > name2) return 1
  return 0
}

// ====== READ
export const getCategories = (survey: ArenaSurvey): CategoriesByUuid =>
  (A.prop(categoriesKey)(survey) ?? {}) as CategoriesByUuid

export const getCategoriesArray = (survey: ArenaSurvey): ArenaCategory[] =>
  Object.values(getCategories(survey)).sort(compareByName)

export const getCategoryByUuid =
  (uuid: string) =>
  (survey: ArenaSurvey): ArenaCategory | undefined =>
    Surveys.getCategoryByUuid({ survey, categoryUuid: uuid })

export const getCategoryByName =
  (name: string) =>
  (survey: ArenaSurvey): ArenaCategory | undefined =>
    Object.values(getCategories(survey)).find((category) => Category.getName(category) === name)

export const getSamplingPointDataCategory = getCategoryByName(Category.samplingPointDataCategoryName)

export const getSamplingPointDataNodeDefs = (survey: ArenaSurvey): ArenaAnyNodeDef[] => {
  const samplingPointDataCategory = getSamplingPointDataCategory(survey)
  if (!samplingPointDataCategory) return []

  return SurveyNodeDefs.findDescendants({
    nodeDef: SurveyNodeDefs.getNodeDefRoot(survey),
    filterFn: (nodeDef) => NodeDef.getCategoryUuid(nodeDef) === samplingPointDataCategory.uuid,
  })(survey)
}

// checks if category name is used in some expressions (e.g. categoryItemProp function)
const isCategoryUsedInExpressions =
  (category: ArenaCategory) =>
  (survey: ArenaSurvey): boolean =>
    !!SurveyNodeDefs.findNodeDef((nodeDef) => {
      const expressions = NodeDef.getAllExpressions(nodeDef)
      const categoryName = Category.getName(category)
      return expressions.some((expression) =>
        new RegExp(String.raw`${functionNames.categoryItemProp}\s*\(\s*['|"]${categoryName}['|"]\s*,.*\)`).test(
          expression
        )
      )
    })(survey)

export const isCategoryUnused =
  (category: ArenaCategory) =>
  (survey: ArenaSurvey): boolean =>
    !Category.isReportingData(category) &&
    !Category.isSamplingUnitsPlanCategory(category) &&
    Objects.isEmpty(SurveyNodeDefs.getNodeDefsByCategoryUuid(Category.getUuid(category))(survey)) &&
    !isCategoryUsedInExpressions(category)(survey)

// ====== UPDATE
export const assocCategories =
  (newCategories: CategoriesByUuid) =>
  (survey: ArenaSurvey): ArenaSurvey =>
    A.assoc(categoriesKey, newCategories, survey)

export const assocCategory =
  (category: ArenaCategory) =>
  (survey: ArenaSurvey): ArenaSurvey =>
    Objects.assocPath({ obj: survey, path: [categoriesKey, Category.getUuid(category)], value: category })
