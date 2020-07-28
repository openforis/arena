import { useEffect, useState } from 'react'

import { State } from './state'

export const useLocalState = (props) => {
  const { canSelect, onCategoryCreated, onCategoryOpen, onSelect, selectedItemUuid } = props

  const [state, setState] = useState(() =>
    State.create({ canSelect, onCategoryCreated, onCategoryOpen, onSelect, selectedItemUuid })
  )

  useEffect(() => {
    setState((prevState) => State.assocSelectedItemUuid(selectedItemUuid)(prevState))
  }, [selectedItemUuid])

  return { state, setState }
}
