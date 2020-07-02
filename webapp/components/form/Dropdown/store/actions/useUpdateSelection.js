import { State } from '../state'

export const useUpdateSelection = ({ closeDialog, onBeforeChange, onChange }) => async ({ item, selection, state }) => {
  const keySelection = selection && State.getItemKey(state)(selection)
  const keyItem = State.getItemKey(state)(item)

  await closeDialog({ selection, state })

  if (keyItem !== keySelection && (!onBeforeChange || (await onBeforeChange(item)))) {
    await onChange(item)
  }
}
