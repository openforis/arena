import { useState } from 'react'

import { useOnUpdate } from '@webapp/components/hooks'

import { useActions } from './actions'
import { State } from './state'

export const useDropdown = ({
  autocompleteMinChars,
  disabled,
  itemKey,
  itemLabel,
  items,
  onBeforeChange,
  onChange,
  readOnly,
  selection,
}) => {
  const [state, setState] = useState(() =>
    State.create({
      autocompleteMinChars,
      disabled,
      items,
      itemKey,
      itemLabel,
      readOnly,
      selection,
    })
  )
  const Actions = useActions({ setState, onBeforeChange, onChange })

  // on update selection: update input value
  useOnUpdate(() => {
    ;(async () => {
      await Actions.closeDialog({ selection, state })
    })()
  }, [selection])

  return { Actions, state }
}
