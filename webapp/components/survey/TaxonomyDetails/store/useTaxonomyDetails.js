import { useState, useEffect } from 'react'

import { useActions } from './actions'

export const useTaxonomyDetails = (props) => {
  const { taxonomyUuid } = props

  const [state, setState] = useState({})

  const Actions = useActions({ setState })

  useEffect(() => {
    Actions.init({ state, taxonomyUuid })
  }, [])

  return { state, Actions }
}
