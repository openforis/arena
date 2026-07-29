import { Category as ArenaCategory } from '@openforis/arena-core'

import * as Category from '@core/survey/category'
import {
  checkCloneFromSurveyDuplicate,
  CloneFromSurveyDuplicateCheckResult,
} from '@core/survey/cloneFromSurveyDuplicateCheck'

export type CategoryDuplicateCheckResult = CloneFromSurveyDuplicateCheckResult

/**
 * Checks whether the source category to be cloned would clash (by uuid or name) with an existing category in the current survey.
 *
 * @param {object} params - The params.
 * @param {object[]} params.currentSurveyCategories - Categories already existing in the current survey.
 * @param {object | null} params.sourceCategory - Category selected to be cloned.
 * @returns {CategoryDuplicateCheckResult} Duplicate check result, or null if no clash was found.
 */
export const getCategoryDuplicateCheck = ({
  currentSurveyCategories,
  sourceCategory,
}: {
  currentSurveyCategories: ArenaCategory[]
  sourceCategory: ArenaCategory | null
}): CategoryDuplicateCheckResult => {
  if (!sourceCategory) return null

  return checkCloneFromSurveyDuplicate({
    targetSurveyItems: currentSurveyCategories,
    sourceItem: sourceCategory,
    getUuid: Category.getUuid,
    getName: Category.getName,
    uuidDuplicateErrorKey: 'validationErrors:categoryImport.uuidDuplicate',
    nameDuplicateErrorKey: 'validationErrors:categoryImport.nameDuplicate',
  })
}
