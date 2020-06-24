import * as R from 'ramda'
import { useDispatch } from 'react-redux'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import * as Chain from '@common/analysis/processingChain'

import { NotificationActions } from '@webapp/store/ui'
import { useLang } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'

export const useCanSelectNodeDef = ({ chain }) => {
  const dispatch = useDispatch()
  const survey = useSurvey()
  const lang = useLang()

  return (nodeDefId) => {
    const nodeDef = Survey.getNodeDefByUuid(R.prop('key', nodeDefId))(survey)
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
