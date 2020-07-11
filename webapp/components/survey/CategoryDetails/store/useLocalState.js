import { useEffect, useState } from 'react'

import { useActions } from './actions'

export const useLocalState = (props) => {
  const { onCategoryCreated, categoryUuid } = props

  const [state, setState] = useState({})

  const Actions = useActions({ setState })

  useEffect(() => {
    Actions.init({ onCategoryCreated, categoryUuid })
  }, [])

  return { state, setState }
}
