import { useState, useEffect } from 'react'

import { useActions } from './actions'

export const useTaxonomyDetails = (props) => {
  const { taxonomy } = props

  const [state, setState] = useState({})

  const Actions = useActions({ setState })

  useEffect(() => {
    Actions.init({ state, taxonomy })
  }, [])

  return { state, Actions }
}
