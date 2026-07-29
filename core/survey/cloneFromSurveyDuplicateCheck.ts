export type CloneFromSurveyDuplicateCheckResult = {
  key: string
  params: { name: string }
} | null

/**
 * Checks whether an item to be cloned from another survey (a category or a taxonomy) would clash
 * (by uuid or by name) with an item already existing in the target survey.
 *
 * Uuids are preserved when cloning: if an item with the same uuid already exists in the target survey,
 * it means this exact item has already been cloned there before (even if renamed since), so cloning it
 * again is not allowed. Otherwise, cloning an item with the same name as an existing one is not allowed either.
 *
 * @param {object} params - The params.
 * @param {T[]} params.targetSurveyItems - Items already existing in the target survey.
 * @param {T} params.sourceItem - Item selected to be cloned.
 * @param {(item: T) => string} params.getUuid - Function returning the uuid of an item.
 * @param {(item: T) => string} params.getName - Function returning the name of an item.
 * @param {string} params.uuidDuplicateErrorKey - Validation error key to return when a uuid clash is found.
 * @param {string} params.nameDuplicateErrorKey - Validation error key to return when a name clash is found.
 * @returns {CloneFromSurveyDuplicateCheckResult} Duplicate check result, or null if no clash was found.
 */
export const checkCloneFromSurveyDuplicate = <T>({
  targetSurveyItems,
  sourceItem,
  getUuid,
  getName,
  uuidDuplicateErrorKey,
  nameDuplicateErrorKey,
}: {
  targetSurveyItems: T[]
  sourceItem: T
  getUuid: (item: T) => string
  getName: (item: T) => string
  uuidDuplicateErrorKey: string
  nameDuplicateErrorKey: string
}): CloneFromSurveyDuplicateCheckResult => {
  const sourceItemUuid = getUuid(sourceItem)
  const sourceItemName = getName(sourceItem)

  const itemWithSameUuid = targetSurveyItems.find((item) => getUuid(item) === sourceItemUuid)
  if (itemWithSameUuid) {
    return { key: uuidDuplicateErrorKey, params: { name: getName(itemWithSameUuid) } }
  }

  if (targetSurveyItems.some((item) => getName(item) === sourceItemName)) {
    return { key: nameDuplicateErrorKey, params: { name: sourceItemName } }
  }

  return null
}
