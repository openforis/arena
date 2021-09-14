import { State } from '../state'

export const useUpdateSelection =
  ({ onBeforeChange, onChange }) =>
  async ({ item, selection, state }) => {
    const keySelection = selection && State.getItemKey(state)(selection)
    const keyItem = State.getItemKey(state)(item)

    if (keyItem !== keySelection && (!onBeforeChange || (await onBeforeChange(item)))) {
      await onChange(item)
    }
  }
