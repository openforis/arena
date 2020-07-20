import { useState, useEffect } from 'react'

import { useParams } from 'react-router'

import { useActions } from './actions'

export const useTaxonomyDetails = (props) => {
  const { taxonomyUuid } = props
  const { taxonomyUuid: taxonomyUuidParam } = useParams()
  const [state, setState] = useState({})

  const Actions = useActions({ setState })

  useEffect(() => {
    Actions.init({ state, taxonomyUuid: taxonomyUuidParam || taxonomyUuid })
  }, [])

  return { state, Actions }
}
