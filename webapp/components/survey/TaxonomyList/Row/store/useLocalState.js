import { useState } from 'react'

import { useActions } from './actions'
import { State } from './state'
import { useOnValueChange } from '@webapp/components/hooks'

export const useLocalState = (props) => {
  const { selectedItemUuid, item: taxonomy, canDelete, onTaxonomySelect, canSelect, initData, onTaxonomyOpen } = props

  const [state, setState] = useState(() =>
    State.create({ taxonomy, canDelete, selectedItemUuid, onTaxonomySelect, canSelect, initData, onTaxonomyOpen })
  )

  useOnValueChange(selectedItemUuid, (uuid) => setState(State.assocSelectedItemUuid(uuid)))
  useOnValueChange(taxonomy, (taxonomyUpdated) => setState(State.assocTaxonomy(taxonomyUpdated)))

  const Actions = useActions()

  return { state, Actions }
}
