import { useState } from 'react'

import { State } from './state'
import { useOnValueChange } from '@webapp/components/hooks'

export const useLocalState = (props) => {
  const { canSelect, onCategoryCreated, onCategoryOpen, onSelect, selectedItemUuid } = props

  const [state, setState] = useState(() =>
    State.create({ canSelect, onCategoryCreated, onCategoryOpen, onSelect, selectedItemUuid })
  )

  useOnValueChange(selectedItemUuid, (uuid) => setState(State.assocSelectedItemUuid(uuid)))

  return { state, setState }
}
