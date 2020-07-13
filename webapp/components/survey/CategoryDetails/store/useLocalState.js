import { useEffect, useState } from 'react'
import { matchPath, useLocation } from 'react-router'

import { designerModules, appModuleUri } from '@webapp/app/appModules'

import { useActions } from './actions'
import { State } from './state'

export const useLocalState = (props) => {
  const { categoryUuid, onCategoryCreated } = props

  const { pathname } = useLocation()
  const inCategoriesPath = Boolean(matchPath(pathname, `${appModuleUri(designerModules.category)}:uuid/`))

  const [state, setState] = useState(State.create({ inCategoriesPath }))

  const Actions = useActions({ setState })

  useEffect(() => {
    Actions.init({ categoryUuid, onCategoryCreated })
  }, [])

  return { state, setState }
}
