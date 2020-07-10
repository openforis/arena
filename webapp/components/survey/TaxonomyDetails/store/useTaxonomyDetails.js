import { useState, useEffect } from 'react'

import { useActions } from './actions'

export const useTaxonomyDetails = (props) => {
  const { onTaxonomyCreated, taxonomy } = props

  const [state, setState] = useState({})

  const Actions = useActions({ setState })

  useEffect(() => {
    Actions.init({ state, onTaxonomyCreated, taxonomy })
  }, [])

  return { state, Actions }
}
