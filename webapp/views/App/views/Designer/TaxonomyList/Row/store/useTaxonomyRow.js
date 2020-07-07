import { useState, useEffect } from 'react'

import { useActions } from './actions'
import { State } from './state'

export const useTaxonomyRow = (props) => {
  const { selectedItemUuid } = props

  const [state, setState] = useState(State.create(props))

  useEffect(() => {
    setState((prevState) => State.assocSelectedItemUuid(selectedItemUuid)(prevState))
  }, [selectedItemUuid])

  const Actions = useActions({ setState })

  return { state, Actions }
}
