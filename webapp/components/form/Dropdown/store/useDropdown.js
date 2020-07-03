import { useEffect, useState } from 'react'

import * as A from '@core/arena'
import { useOnUpdate } from '@webapp/components/hooks'

import { useActions } from './actions'
import { State } from './state'

export const useDropdown = ({
  autocompleteMinChars,
  disabled,
  inputRef,
  itemKey,
  itemLabel,
  items,
  onBeforeChange,
  onChange,
  readOnly,
  selection,
}) => {
  const [state, setState] = useState({})
  const Actions = useActions({ setState, onBeforeChange, onChange })

  // on mount create state
  useEffect(() => {
    setState(
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
  }, [])

  // on update selection: update input value
  useOnUpdate(() => {
    const inputValue = A.isEmpty(selection) ? inputRef.current.value : State.getItemLabel(state)(selection)
    setState(State.assocInputValue(inputValue)(state))
  }, [selection])

  return { Actions, state }
}
