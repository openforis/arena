import { useState } from 'react'

import { useActions } from './actions'
import { State } from './state'

export const useLocalState = ({ itemKey, itemLabel, onChange, onItemAdd, onItemRemove }) => {
  const [state] = useState(() =>
    State.create({
      itemKey,
      itemLabel,
    })
  )
  const Actions = useActions({ onChange, onItemAdd, onItemRemove })

  return { Actions, state }
}
