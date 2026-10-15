import { useCallback, useMemo, useRef, useState } from 'react'

import type { ChangeSetCardState } from '@webapp/ai/changeSets/types'

import { getConflictingOperationIds, getPendingOperationIds } from './changeSetCardModel'
import {
  getBehaviourOperationIds,
  getInitialDeselectedIds,
  setDeselected,
  toggleDeselected,
} from './changeSetSelectionModel'

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
  const [deselected, setDeselectedIds] = useState<string[]>(() =>
    getInitialDeselectedIds({ changeSet: cardState.changeSet, compact })
  )
  const [applying, setApplying] = useState(false)
  // set before the re-render, so two quick clicks can't both start an Apply
  const applyingRef = useRef(false)

  const pendingIds = useMemo(() => getPendingOperationIds(cardState), [cardState])
  const conflictIds = useMemo(() => getConflictingOperationIds({ cardState, survey }), [cardState, survey])
  const selectableIds = useMemo(() => pendingIds.filter((id) => !conflictIds.includes(id)), [conflictIds, pendingIds])
  const selectedIds = useMemo(() => selectableIds.filter((id) => !deselected.includes(id)), [deselected, selectableIds])

  const unselectedBehaviourIds = useMemo(
    () =>
      getBehaviourOperationIds(cardState.changeSet).filter(
        (id) => selectableIds.includes(id) && !selectedIds.includes(id)
      ),
    [cardState.changeSet, selectableIds, selectedIds]
  )

  const toggle = useCallback((id: string) => setDeselectedIds((prev) => toggleDeselected(prev, id)), [])

  const setSelected = useCallback(
    (ids: string[], selected: boolean) => setDeselectedIds((prev) => setDeselected(prev, ids, selected)),
    []
  )

  /**
   * Runs an Apply or Discard unless one is already running.
   * @param {Function} action - The action to run.
   * @returns {Promise<void>} Resolves when the action ends.
   */
  const runExclusive = async (action: () => Promise<void> | void): Promise<void> => {
    if (applyingRef.current) return
    applyingRef.current = true
    setApplying(true)
    try {
      await action()
    } finally {
      applyingRef.current = false
      setApplying(false)
    }
  }

  return {
    pendingIds,
    conflictIds,
    selectableIds,
    selectedIds,
    unselectedBehaviourIds,
    applying,
    toggle,
    setSelected,
    apply: () => runExclusive(() => onApply(selectedIds)),
    discard: () => runExclusive(onDiscard),
  }
}
