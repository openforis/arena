import { useEffect, useState } from 'react'

import { useActions } from './actions'

export const useLocalState = (props) => {
  const { categoryUuid } = props
  const [state, setState] = useState({})

  const Actions = useActions({ setState })

  useEffect(() => {
    ;(async () => {
      await Actions.init({ state, categoryUuid })
    })()
  }, [])

  return { state, setState }
}
