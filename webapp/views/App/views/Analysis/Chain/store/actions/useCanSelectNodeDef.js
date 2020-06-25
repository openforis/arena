import { useDispatch } from 'react-redux'

import * as NodeDef from '@core/survey/nodeDef'

import * as Chain from '@common/analysis/processingChain'

import { NotificationActions } from '@webapp/store/ui'
import { useLang } from '@webapp/store/system'

export const useCanSelectNodeDef = ({ chain }) => {
  const dispatch = useDispatch()
  const lang = useLang()

  return (nodeDef) => {
    if (NodeDef.belongsToAllCycles(Chain.getCycles(chain))(nodeDef)) {
      return true
    }
    dispatch(
      NotificationActions.notifyError({
        key: 'processingChainView.cannotSelectNodeDefNotBelongingToCycles',
        params: { label: NodeDef.getLabel(nodeDef, lang) },
      })
    )
    return false
  }
}
