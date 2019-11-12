import * as R from 'ramda'

import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'

import * as Validation from '@core/validation/validation'
import * as ObjectUtils from '@core/objectUtils'

// category

export const assocCategory = category => R.assoc(Category.getUuid(category), category)

export const dissocCategory = category => R.dissoc(Category.getUuid(category))

export const assocCategoryProp = (category, key, value) => R.pipe(
  R.assocPath([
      Category.getUuid(category),
      ObjectUtils.keys.props,
      key
    ],
    value
  ),
  R.dissocPath([
    Category.getUuid(category),
    Validation.keys.validation,
    Validation.keys.fields,
    key
  ]),
)

// category level

export const assocCategoryLevelProp = (category, level, key, value) => R.pipe(
  R.assocPath([
      Category.getUuid(category),
      Category.keys.levels,
      CategoryLevel.getIndex(level) + '',
      ObjectUtils.keys.props,
      key
    ],
    value
  ),
  R.dissocPath([
    Category.getUuid(category),
    Category.keys.levels,
    CategoryLevel.getIndex(level) + '',
    Validation.keys.validation,
    Validation.keys.fields,
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
    Validation.keys.validation,
    Validation.keys.fields,
    CategoryLevel.keys.items,
    Validation.keys.fields,
    CategoryItem.getUuid(item),
    Validation.keys.fields,
    key
  ])

