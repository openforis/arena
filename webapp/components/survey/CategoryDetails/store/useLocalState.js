import { useEffect, useState } from 'react'

import { useActions } from './actions'

export const useLocalState = (props) => {
  const { onCategoryCreated, category } = props

  const [state, setState] = useState({})

  const Actions = useActions({ setState })

  useEffect(() => {
    Actions.init({ state, onCategoryCreated, category })
  }, [])

  return { state, setState }
}
