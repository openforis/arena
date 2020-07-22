import { useState } from 'react'

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

  return { Actions, state }
}
