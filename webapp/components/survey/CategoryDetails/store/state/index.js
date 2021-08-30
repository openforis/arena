import { create } from './create'

import {
  getCategory,
  getImportSummary,
  getItemActive,
  getItemActiveLastLevelIndex,
  getItemsArray,
  isItemActiveLeaf,
  isCategoryEmpty,
  isCleaned,
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
  assocCleaned,
} from './update'

export const State = {
  create,

  getCategory,
  getImportSummary,
  getItemActive,
  getItemActiveLastLevelIndex,
  getItemsArray,
  isItemActiveLeaf,
  isCategoryEmpty,
  isCleaned,

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
  assocCleaned,
}
