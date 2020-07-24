import { useEffect, useState } from 'react'

import { useActions } from './actions'
import { State } from './state'

export const useLocalState = ({
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
    setState(State.assocItems(items))
  }, [items])

  useEffect(() => {
    setState(State.assocInputField(inputField))
  }, [inputField])

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
  }, [list.current, State.getItems(state), State.getInputField(state)])

  return { Actions, state }
}
