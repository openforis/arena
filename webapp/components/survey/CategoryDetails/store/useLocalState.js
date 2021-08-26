import { useCallback, useEffect, useState } from 'react'
import { useHistory } from 'react-router'

import { useActions } from './actions'
import { State } from './state'
import { useOnBrowserBack } from '@webapp/components/hooks'

export const useLocalState = (props) => {
  const { categoryUuid } = props

  const history = useHistory()

  const [state, setState] = useState({})

  const Actions = useActions({ setState })

  const categoryEmpty = State.isCategoryEmpty(state)

  const deleteCategoryIfEmpty = useCallback(async () => {
    await Actions.deleteCategoryIfEmpty({ categoryUuid })
    setState({})
    history.goBack()
    return true
  }, [])

  useEffect(() => {
    ;(async () => {
      await Actions.init({ state, categoryUuid })
    })()
  }, [])

  useOnBrowserBack({
    active: categoryEmpty,
    onBack: deleteCategoryIfEmpty,
  })

  return { state, setState }
}
