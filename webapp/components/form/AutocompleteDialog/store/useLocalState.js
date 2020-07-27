import { useEffect, useState } from 'react'

import { useOnUpdate } from '@webapp/components/hooks'

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
      list,
    })
  )
  const Actions = useActions({ setState, onItemSelect, onClose })

  useOnUpdate(() => {
    setState(State.assocItems(items))
  }, [items])

  useOnUpdate(() => {
    setState(State.assocInputField(inputField))
  }, [inputField])

  useOnUpdate(() => {
    setState(State.assocList(list))
  }, [list])

  useEffect(() => {
    const keyDownListener = Actions.onInputFieldKeyDown({ state })

    const clickListener = Actions.onOutsideClick({ state })

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
  }, [State.getList(state), State.getItems(state), State.getInputField(state)])

  return { Actions, state }
}
