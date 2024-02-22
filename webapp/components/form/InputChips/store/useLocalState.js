import { useState } from 'react'

import { useActions } from './actions'
import { State } from './state'

export const useLocalState = ({
  onChange,
  onItemAdd,
  onItemRemove,
  itemKey = null,
  itemLabel = null,
  isInputFieldValueValid = null,
  textTransformFunction = null,
}) => {
  const [state, setState] = useState(() =>
    State.create({
      itemKey,
      itemLabel,
      isInputFieldValueValid,
      textTransformFunction,
    })
  )
  const Actions = useActions({ onChange, onItemAdd, onItemRemove, setState })

  return { Actions, state }
}
