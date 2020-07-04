import { useCallback } from 'react'

import { useDispatch } from 'react-redux'

import * as NodeDef from '@core/survey/nodeDef'

import * as Chain from '@common/analysis/processingChain'

import { NotificationActions } from '@webapp/store/ui'
import { useLang } from '@webapp/store/system'

import { State } from '../state'

export const useCanSelectNodeDef = () => {
  const dispatch = useDispatch()
  const lang = useLang()

  return useCallback(({ nodeDef, state }) => {
    const chainEdit = State.getChainEdit(state)

    if (NodeDef.belongsToAllCycles(Chain.getCycles(chainEdit))(nodeDef)) {
      return true
    }
    dispatch(
      NotificationActions.notifyError({
        key: 'processingChainView.cannotSelectNodeDefNotBelongingToCycles',
        params: { label: NodeDef.getLabel(nodeDef, lang) },
      })
    )
    return false
  }, [])
}
