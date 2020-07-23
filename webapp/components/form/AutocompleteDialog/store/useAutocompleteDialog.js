import { useEffect, useState } from 'react'

import { useActions } from './actions'
import { State } from './state'

export const useAutocompleteDialog = ({
  inputField,
  sourceElement,
  items,
  itemLabel,
  itemKey,
  onItemSelect,
  onClose,
  list,
}) => {
  const [state, setState] = useState(() =>
    State.create({
      inputField,
      sourceElement,
      items,
      itemLabel,
      itemKey,
    })
  )
  const Actions = useActions({ setState, onItemSelect, onClose })

  useEffect(() => {
    const keyDownListener = Actions.onInputFieldKeyDown({
      list,
      state,
    })

    const clickListener = Actions.onOutsideClick({
      list,
      state,
    })

    if (inputField) {
      inputField.addEventListener('keydown', keyDownListener)
    }
    window.addEventListener('click', clickListener)

    return () => {
      if (inputField) {
        inputField.removeEventListener('keydown', keyDownListener)
      }

      window.removeEventListener('click', clickListener)
    }
  }, [State.getInputField(state), list.current])

  return { Actions, state }
}
