import { useState, useEffect } from 'react'

import { useActions } from './actions'
import { State } from './state'

export const useTaxonomyRow = (props) => {
  const { selectedItemUuid, row: taxonomy, canDelete, onSelectTaxonomy, canSelect, initData } = props

  const [state, setState] = useState(() =>
    State.create({ taxonomy, canDelete, selectedItemUuid, onSelectTaxonomy, canSelect, initData })
  )

  useEffect(() => {
    setState((prevState) => State.assocSelectedItemUuid(selectedItemUuid)(prevState))
  }, [selectedItemUuid])

  const Actions = useActions()

  return { state, Actions }
}
