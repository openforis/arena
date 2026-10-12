import { useCallback, useMemo, useRef, useState } from 'react'

import type { ChangeSetCardState } from '@webapp/ai/changeSets/types'

import { getConflictingOperationIds, getPendingOperationIds } from './changeSetCardModel'

export type ChangeSetSelection = {
  pendingIds: string[]
  conflictIds: string[]
  // pending without conflict
  selectableIds: string[]
  selectedIds: string[]
  applying: boolean
  toggle: (id: string) => void
  setSelected: (ids: string[], selected: boolean) => void
  apply: () => Promise<void>
  discard: () => Promise<void>
}

/**
 * Selection, Apply and Discard of a change set, shared by its card and its review dialog. Every pending operation
 * without conflict starts selected.
 * @param {object} params - Parameters.
 * @param {ChangeSetCardState} params.cardState - Card state.
 * @param {object} params.survey - Current survey (conflicts).
 * @param {Function} params.onApply - Applies the selected operations.
 * @param {Function} params.onDiscard - Discards the card.
 * @returns {ChangeSetSelection} The selection and its actions.
 */
export const useChangeSetSelection = ({
  cardState,
  survey,
  onApply,
  onDiscard,
}: {
  cardState: ChangeSetCardState
  survey: any
  onApply: (operationIds: string[]) => Promise<void>
  onDiscard: () => Promise<void> | void
}): ChangeSetSelection => {
  const [deselected, setDeselected] = useState<string[]>([])
  const [applying, setApplying] = useState(false)
  // set before the re-render, so two quick clicks can't both start an Apply
  const applyingRef = useRef(false)

  const pendingIds = useMemo(() => getPendingOperationIds(cardState), [cardState])
  const conflictIds = useMemo(() => getConflictingOperationIds({ cardState, survey }), [cardState, survey])
  const selectableIds = useMemo(() => pendingIds.filter((id) => !conflictIds.includes(id)), [conflictIds, pendingIds])
  const selectedIds = useMemo(() => selectableIds.filter((id) => !deselected.includes(id)), [deselected, selectableIds])

  const toggle = useCallback(
    (id: string) => setDeselected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])),
    []
  )

  const setSelected = useCallback(
    (ids: string[], selected: boolean) =>
      setDeselected((prev) => (selected ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])])),
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
    applying,
    toggle,
    setSelected,
    apply: () => runExclusive(() => onApply(selectedIds)),
    discard: () => runExclusive(onDiscard),
  }
}
