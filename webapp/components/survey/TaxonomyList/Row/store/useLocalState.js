import { useEffect, useState } from 'react'

import { useActions } from './actions'
import { State } from './state'

export const useLocalState = (props) => {
  const { selectedItemUuid, row: taxonomy, canDelete, onTaxonomySelect, canSelect, initData, onTaxonomyOpen } = props

  const [state, setState] = useState(() =>
    State.create({ taxonomy, canDelete, selectedItemUuid, onTaxonomySelect, canSelect, initData, onTaxonomyOpen })
  )

  useEffect(() => {
    setState((prevState) => State.assocSelectedItemUuid(selectedItemUuid)(prevState))
  }, [selectedItemUuid])

  useEffect(() => {
    setState((prevState) => State.assocTaxonomy(taxonomy)(prevState))
  }, [taxonomy])

  const Actions = useActions()

  return { state, Actions }
}
