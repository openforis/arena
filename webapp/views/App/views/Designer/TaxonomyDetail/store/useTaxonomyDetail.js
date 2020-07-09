import { useState, useEffect } from 'react'

import { useActions } from './actions'
import { State } from './state'

export const useTaxonomyDetail = (props) => {
  const { taxonomy } = props

  const [state, setState] = useState(() => State.create({ taxonomy }))

  useEffect(() => {
    setState(State.assocTaxonomy(taxonomy)(state))
  }, [taxonomy])

  const Actions = useActions({ setState })

  return { state, Actions }
}
