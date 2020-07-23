import { useState } from 'react'

import { useOnUpdate } from '@webapp/components/hooks'

import { useActions } from './actions'
import { State } from './state'

export const useInputChips = ({
  items,
  itemKey,
  itemLabel,
  readOnly,
  disabled,
  validation,
  onChange,
  onItemAdd,
  onItemRemove,
}) => {
  const [state, setState] = useState(() =>
    State.create({
      items,
      itemKey,
      itemLabel,
      readOnly,
      disabled,
      validation,
    })
  )
  const Actions = useActions({ setState, onChange, onItemAdd, onItemRemove })

  return { Actions, state }
}
