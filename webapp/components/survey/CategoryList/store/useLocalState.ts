import { useState } from 'react'

import { useOnValueChange } from '@webapp/components/hooks'

import { State } from './state'

export const useLocalState = (props) => {
  const { canSelect, onCategoryCreated, onCategoryOpen, onSelect, selectedItemUuid } = props

  const [state, setState] = useState(() =>
    State.create({ canSelect, onCategoryCreated, onCategoryOpen, onSelect, selectedItemUuid })
  )

  useOnValueChange(selectedItemUuid, (uuid) => setState(State.assocSelectedItemUuid(uuid)))

  return { state, setState }
}
