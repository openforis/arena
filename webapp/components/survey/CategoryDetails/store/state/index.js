import { create } from './create'

import {
  getCategory,
  getCategoryUuid,
  getImportSummary,
  getItemActive,
  getItemActiveLastLevelIndex,
  getItemsArray,
  isItemActiveLeaf,
  isInCategoriesPath,
} from './read'

import {
  assocCategory,
  assocCategoryProp,
  assocLevelProp,
  assocItems,
  assocItem,
  assocItemProp,
  assocItemActive,
  dissocItemActive,
  dissocItemsActive,
  dissocItem,
  dissocItems,
  assocImportSummary,
  assocImportSummaryColumnDataType,
  dissocImportSummary,
} from './update'

export const State = {
  create,

  getCategory,
  getCategoryUuid,
  getImportSummary,
  getItemActive,
  getItemActiveLastLevelIndex,
  getItemsArray,
  isItemActiveLeaf,
  isInCategoriesPath,

  assocCategory,
  assocCategoryProp,
  assocLevelProp,
  assocItems,
  assocItem,
  assocItemProp,
  assocItemActive,
  dissocItemActive,
  dissocItemsActive,
  dissocItem,
  dissocItems,
  assocImportSummary,
  assocImportSummaryColumnDataType,
  dissocImportSummary,
}
