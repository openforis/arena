import { useMemo } from 'react'

import type { ChangeSetCardState } from '@webapp/ai/changeSets/types'

import { getConflictingOperationIds, getPendingOperationIds } from './changeSetCardModel'
import { getBehaviourOperationIds, getInitialDeselectedIds } from './changeSetSelectionModel'
import { useExclusiveRun } from './useExclusiveRun'
import { useOperationSelection } from './useOperationSelection'

export type ChangeSetSelection = {
  pendingIds: string[]
  conflictIds: string[]
  // pending without conflict
  selectableIds: string[]
  selectedIds: string[]
  // expression and property changes that are not selected (they start unselected on a long change set)
  unselectedBehaviourIds: string[]
  applying: boolean
  toggle: (id: string) => void
  setSelected: (ids: string[], selected: boolean) => void
  apply: () => Promise<void>
  discard: () => Promise<void>
}

/**
 * Selection, Apply and Discard of a change set, shared by its card and its review dialog. Every pending operation
 * without conflict starts selected, except the expression and property changes of a compact card.
 * @param {object} params - Parameters.
 * @param {ChangeSetCardState} params.cardState - Card state.
 * @param {boolean} params.compact - The card is compact: its changes are reviewed in the dialog.
 * @param {object} params.survey - Current survey (conflicts).
 * @param {Function} params.onApply - Applies the selected operations.
 * @param {Function} params.onDiscard - Discards the card.
 * @returns {ChangeSetSelection} The selection and its actions.
 */
export const useChangeSetSelection = ({
  cardState,
  compact,
  survey,
  onApply,
  onDiscard,
}: {
  cardState: ChangeSetCardState
  compact: boolean
  survey: any
  onApply: (operationIds: string[]) => Promise<void>
  onDiscard: () => Promise<void> | void
}): ChangeSetSelection => {
  const pendingIds = useMemo(() => getPendingOperationIds(cardState), [cardState])
  const conflictIds = useMemo(() => getConflictingOperationIds({ cardState, survey }), [cardState, survey])
  const selectableIds = useMemo(() => pendingIds.filter((id) => !conflictIds.includes(id)), [conflictIds, pendingIds])
  const { selectedIds, toggle, setSelected } = useOperationSelection({
    selectableIds,
    getInitialDeselectedIds: () => getInitialDeselectedIds({ changeSet: cardState.changeSet, compact }),
  })
  const { running: applying, run } = useExclusiveRun()

  const unselectedBehaviourIds = useMemo(
    () =>
      getBehaviourOperationIds(cardState.changeSet).filter(
        (id) => selectableIds.includes(id) && !selectedIds.includes(id)
      ),
    [cardState.changeSet, selectableIds, selectedIds]
  )

  return {
    pendingIds,
    conflictIds,
    selectableIds,
    selectedIds,
    unselectedBehaviourIds,
    applying,
    toggle,
    setSelected,
    apply: () => run(() => onApply(selectedIds)),
    discard: () => run(onDiscard),
  }
}
