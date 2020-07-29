import { useState } from 'react'

import { useOnUpdate } from '@webapp/components/hooks'

import { useActions } from './actions'
import { State } from './state'

export const useLocalState = ({
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

  // on update selection: call closeDialog to reset input value
  useOnUpdate(() => {
    Actions.closeDialog({ selection, state })
  }, [selection])

  return { Actions, state }
}
