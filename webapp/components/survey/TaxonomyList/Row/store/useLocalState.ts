import { useState } from 'react'

import { useOnValueChange } from '@webapp/components/hooks'

import { useActions } from './actions'
import { State } from './state'

export const useLocalState = (props) => {
  const { selectedItemUuid, item: taxonomy, canDelete, onTaxonomySelect, canSelect, initData } = props

  const [state, setState] = useState(() =>
    State.create({ taxonomy, canDelete, selectedItemUuid, onTaxonomySelect, canSelect, initData })
  )

  useOnValueChange(selectedItemUuid, (uuid) => setState(State.assocSelectedItemUuid(uuid)))
  useOnValueChange(taxonomy, (taxonomyUpdated) => setState(State.assocTaxonomy(taxonomyUpdated)))

  const Actions = useActions()

  return { state, Actions }
}
