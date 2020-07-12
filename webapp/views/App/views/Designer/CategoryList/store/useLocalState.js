import { useEffect, useState } from 'react'
import { matchPath, useLocation } from 'react-router'

import { appModuleUri, designerModules } from '@webapp/app/appModules'

import { State } from './state'

export const useLocalState = (props) => {
  const { canSelect, onAdd, onEdit, onSelect, selectedItemUuid } = props

  const { pathname } = useLocation()

  const inCategoriesPath = Boolean(matchPath(pathname, appModuleUri(designerModules.categories)))

  const [state, setState] = useState(() =>
    State.create({ canSelect, inCategoriesPath, onAdd, onEdit, onSelect, selectedItemUuid })
  )

  useEffect(() => {
    setState((prevState) => State.assocSelectedItemUuid(selectedItemUuid)(prevState))
  }, [selectedItemUuid])

  return { state }
}
