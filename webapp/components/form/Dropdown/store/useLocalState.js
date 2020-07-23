import { useState, useEffect } from 'react'

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
  customItemsFilter,
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
  const Actions = useActions({ setState, onBeforeChange, onChange, customItemsFilter })

  // on update selection: call closeDialog to reset input value
  useOnUpdate(() => {
    Actions.closeDialog({ selection, state })
  }, [selection])

  useEffect(() => {
    setState(State.assocCustomItemsFilter(customItemsFilter))
  }, [customItemsFilter])

  return { Actions, state }
}
