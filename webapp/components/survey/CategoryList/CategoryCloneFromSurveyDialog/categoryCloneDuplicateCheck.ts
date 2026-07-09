import * as Category from '@core/survey/category'

export type CategoryDuplicateCheckResult = {
  key: string
  params: { name: string }
} | null

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
  currentSurveyCategories: object[]
  sourceCategory: object | null
}): CategoryDuplicateCheckResult => {
  if (!sourceCategory) return null

  const sourceCategoryUuid = Category.getUuid(sourceCategory)
  const sourceCategoryName = Category.getName(sourceCategory)

  // category uuids are preserved when cloning: if this exact category has already been cloned
  // into the current survey before (even if renamed since), cloning it again is not allowed
  const categoryWithSameUuid = currentSurveyCategories.find(
    (category: object) => Category.getUuid(category) === sourceCategoryUuid
  )
  if (categoryWithSameUuid) {
    return {
      key: 'validationErrors:categoryImport.uuidDuplicate',
      params: { name: Category.getName(categoryWithSameUuid) },
    }
  }

  const categoryWithSameName = currentSurveyCategories.find(
    (category: object) => Category.getName(category) === sourceCategoryName
  )
  if (categoryWithSameName) {
    return {
      key: 'validationErrors:categoryImport.nameDuplicate',
      params: { name: sourceCategoryName },
    }
  }

  return null
}
