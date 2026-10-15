import { useCallback, useMemo, useState } from 'react'

import { setDeselected, toggleDeselected } from './changeSetSelectionModel'

export type OperationSelection = {
  // the selectable operations that are not deselected
  selectedIds: string[]
  toggle: (id: string) => void
  setSelected: (ids: string[], selected: boolean) => void
}

/**
 * Selection of the operations of a card: every selectable operation is selected unless it was deselected (a new
 * operation that becomes selectable starts selected).
 * @param {object} params - Parameters.
 * @param {string[]} params.selectableIds - Operations that can be selected.
 * @param {Function} [params.getInitialDeselectedIds] - Operations that start deselected (read once).
 * @returns {OperationSelection} The selected operations and the actions that change them.
 */
export const useOperationSelection = ({
  selectableIds,
  getInitialDeselectedIds = () => [],
}: {
  selectableIds: string[]
  getInitialDeselectedIds?: () => string[]
}): OperationSelection => {
  const [deselected, setDeselectedIds] = useState<string[]>(getInitialDeselectedIds)
  const selectedIds = useMemo(() => selectableIds.filter((id) => !deselected.includes(id)), [deselected, selectableIds])
  const toggle = useCallback((id: string) => setDeselectedIds((previous) => toggleDeselected(previous, id)), [])
  const setSelected = useCallback(
    (ids: string[], selected: boolean) => setDeselectedIds((previous) => setDeselected(previous, ids, selected)),
    []
  )
  return { selectedIds, toggle, setSelected }
}
