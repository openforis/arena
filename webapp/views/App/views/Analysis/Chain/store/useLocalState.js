import { useState, useEffect } from 'react'
import { matchPath } from 'react-router'

import { useHistoryListen } from '@webapp/components/hooks'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { AnalysisStorage } from '@webapp/service/storage/analysis'

import { useActions } from './actions'

export const useLocalState = () => {
  const [state, setState] = useState(null)

  const Actions = useActions({ setState })

  // on mount init state
  useEffect(() => {
    ;(async () => {
      await Actions.init()
    })()
  }, [])

  // when navigating to nodeDefDetail page, state gets persisted in localstorage, otherwise it gets removed
  useHistoryListen(
    (location) => {
      if (matchPath(location.pathname, { path: `${appModuleUri(analysisModules.nodeDef)}:uuid/` })) {
        AnalysisStorage.persistChainEdit(state)
      } else {
        AnalysisStorage.removeChainEdit()
      }
    },
    [state]
  )
  return { state, Actions }
}
