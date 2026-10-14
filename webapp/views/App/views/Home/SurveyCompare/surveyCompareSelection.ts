import {
  SurveyCompareApplicabilityStatus,
  SurveyCompareChange,
  SurveyCompareResult,
  SurveyCompareStatus,
  getAllChanges,
} from '@core/survey/surveyCompare/surveyCompareTypes'

const getDiffs = (result: SurveyCompareResult): SurveyCompareChange[] => getAllChanges(result)

export const isSelectable = (diff: any): boolean =>
  diff?.status !== SurveyCompareStatus.identical &&
  Boolean(diff?.applicability) &&
  diff.applicability.status !== SurveyCompareApplicabilityStatus.notApplicable

/**
 * Returns the ids of the changes selected by default: all the applicable additions and changes (removals are never
 * selected by default).
 * @param {SurveyCompareResult} result - The comparison result.
 * @returns {Set<string>} - Ids of the selected changes.
 */
export const getDefaultSelectedIds = (result: SurveyCompareResult): Set<string> =>
  new Set(
    getDiffs(result)
      .filter(
        (diff) =>
          isSelectable(diff) && [SurveyCompareStatus.added, SurveyCompareStatus.changed].includes(diff.status as any)
      )
      .map((diff) => diff.id)
  )

const collectRequired = ({ diffsById, id, acc }) => {
  const diff = diffsById[id]
  if (!diff || acc.has(id)) return
  acc.add(id)
  for (const requiredId of [...diff.dependsOn, ...diff.linkedTo]) {
    collectRequired({ diffsById, id: requiredId, acc })
  }
}

const collectDependents = ({ diffs, id, acc }) => {
  if (acc.has(id)) return
  acc.add(id)
  for (const diff of diffs) {
    if (diff.dependsOn.includes(id)) {
      collectDependents({ diffs, id: diff.id, acc })
    }
  }
}

/**
 * Selects or deselects a change: selecting a change selects the ones it depends on (and the linked ones),
 * deselecting it deselects the ones depending on it.
 * @param {object} params - Parameters.
 * @param {SurveyCompareResult} params.result - The comparison result.
 * @param {Set<string>} params.selectedIds - Currently selected ids.
 * @param {string} params.id - Id of the change to select or deselect.
 * @param {boolean} params.selected - True to select, false to deselect.
 * @returns {Set<string>} - The updated selection.
 */
export const updateSelection = ({
  result,
  selectedIds,
  id,
  selected,
}: {
  result: SurveyCompareResult
  selectedIds: Set<string>
  id: string
  selected: boolean
}): Set<string> => {
  const diffs = getDiffs(result)
  const diffsById = Object.fromEntries(diffs.map((diff) => [diff.id, diff]))
  const updated = new Set(selectedIds)
  const affected = new Set<string>()
  if (selected) {
    collectRequired({ diffsById, id, acc: affected })
    for (const affectedId of affected) {
      if (isSelectable(diffsById[affectedId])) updated.add(affectedId)
    }
  } else {
    collectDependents({ diffs, id, acc: affected })
    for (const affectedId of affected) updated.delete(affectedId)
  }
  return updated
}

const getRemovalLabel = ({ change, result }: { change: SurveyCompareChange; result: SurveyCompareResult }): string => {
  const owner = [...result.categories, ...result.taxonomies].find((diff) => diff.removal?.id === change.id)
  if (owner) return owner.name
  const diff: any = change
  return diff.path ?? diff.name ?? diff.key ?? change.id
}

/**
 * Returns the selected changes that delete something in this survey (elements only in this survey).
 * @param {object} params - Parameters.
 * @param {SurveyCompareResult} params.result - The comparison result.
 * @param {Set<string>} params.selectedIds - Selected ids.
 * @returns {{id: string, label: string, partial: boolean}[]} - The selected deletions (partial: removal of category items or taxa).
 */
export const getSelectedDeletions = ({
  result,
  selectedIds,
}: {
  result: SurveyCompareResult
  selectedIds: Set<string>
}): { id: string; label: string; partial: boolean }[] => {
  const removalIds = new Set(
    [...result.categories, ...result.taxonomies].flatMap((diff) => (diff.removal ? [diff.removal.id] : []))
  )
  return getDiffs(result)
    .filter((change) => change.status === SurveyCompareStatus.removed && selectedIds.has(change.id))
    .map((change) => ({
      id: change.id,
      label: getRemovalLabel({ change, result }),
      partial: removalIds.has(change.id),
    }))
}
