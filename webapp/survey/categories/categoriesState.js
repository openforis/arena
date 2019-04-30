import * as R from 'ramda'

import Category from '../../../common/survey/category'
import CategoryLevel from '../../../common/survey/categoryLevel'

import SurveyUtils from '../../../common/survey/surveyUtils'
import Validator from '../../../common/validation/validator'

// category

export const assocCategory = category => R.assoc(Category.getUuid(category), category)

export const dissocCategory = category => R.dissoc(Category.getUuid(category))

export const assocCategoryProp = (category, key, value) => R.pipe(
  R.assocPath([
      Category.getUuid(category),
      SurveyUtils.keys.props,
      key
    ],
    value
  ),
  R.dissocPath([
    Category.getUuid(category),
    Validator.keys.validation,
    Validator.keys.fields,
    key
  ]),
)

// category level

export const assocCategoryLevelProp = (category, level, key, value) => R.pipe(
  R.assocPath([
      Category.getUuid(category),
      Category.keys.levels,
      CategoryLevel.getIndex(level) + '',
      SurveyUtils.keys.props,
      key
    ],
    value
  ),
  R.dissocPath([
    Category.getUuid(category),
    Category.keys.levels,
    CategoryLevel.getIndex(level) + '',
    Validator.keys.validation,
    Validator.keys.fields,
    key
  ])
)

export const dissocCategoryLevel = (category, level) =>
  R.dissocPath([
    Category.getUuid(category),
    Category.keys.levels,
    level.index + ''
  ])

// category level items
export const dissocCategoryLevelItemValidation = (category, item, key) =>
  R.dissocPath([
    Category.getUuid(category),
    Validator.keys.validation,
    Validator.keys.fields,
    CategoryLevel.keys.items,
    Validator.keys.fields,
    Category.getUuid(item),
    Validator.keys.fields,
    key
  ])

