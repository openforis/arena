import { useMemo } from 'react'

import type { ChangeSetCardState, OperationConflict } from '@webapp/ai/changeSets/types'
import { useConfirm, useNotifyError } from '@webapp/components/hooks'

import { getOperationConflicts, getPendingOperationIds } from './changeSetCardModel'
import { getBehaviourOperationIds, getInitialDeselectedIds } from './changeSetSelectionModel'
import { useExclusiveRun } from './useExclusiveRun'
import { runWithFailureNotice } from './runWithFailureNotice'
import { useOperationSelection } from './useOperationSelection'

export type ChangeSetSelection = {
  pendingIds: string[]
  // pending operations that conflict with the survey, with their reasons
  conflicts: OperationConflict[]
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
  // asks first: a discarded proposal can't be brought back
  discard: () => void
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
  const conflicts = useMemo(() => getOperationConflicts({ cardState, survey }), [cardState, survey])
  const conflictIds = useMemo(() => conflicts.map((conflict) => conflict.id), [conflicts])
  const selectableIds = useMemo(() => pendingIds.filter((id) => !conflictIds.includes(id)), [conflictIds, pendingIds])
  const { selectedIds, toggle, setSelected } = useOperationSelection({
    selectableIds,
    getInitialDeselectedIds: () => getInitialDeselectedIds({ changeSet: cardState.changeSet, compact }),
  })
  const { running: applying, run } = useExclusiveRun()
  const confirm = useConfirm()
  const notifyError = useNotifyError()

  const unselectedBehaviourIds = useMemo(
    () =>
      getBehaviourOperationIds(cardState.changeSet).filter(
        (id) => selectableIds.includes(id) && !selectedIds.includes(id)
      ),
    [cardState.changeSet, selectableIds, selectedIds]
  )

  return {
    pendingIds,
    conflicts,
    conflictIds,
    selectableIds,
    selectedIds,
    unselectedBehaviourIds,
    applying,
    toggle,
    setSelected,
    // a rejection (designer or store error) is shown, not left unhandled
    apply: () =>
      run(async () => {
        await runWithFailureNotice({
          action: () => onApply(selectedIds),
          notifyError,
          key: 'aiAssistant.card.applyFailed',
        })
      }),
    // onCancel is required by useConfirm's inferred (untyped) parameter
    discard: () =>
      confirm({
        key: 'aiAssistant.discardConfirm',
        onOk: () =>
          void run(async () => {
            await runWithFailureNotice({ action: onDiscard, notifyError, key: 'aiAssistant.card.discardFailed' })
          }),
        onCancel: undefined,
      }),
  }
}
