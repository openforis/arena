import * as NodeDef from '@core/survey/nodeDef'
import * as Chain from '@common/analysis/processingChain'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import * as ChainState from '@webapp/loggedin/modules/analysis/chain/state'

import { NotificationActions } from '@webapp/store/ui'
import { I18nState } from '@webapp/store/system'

export const navigateToNodeDefEdit = (history, nodeDefUuid) => () =>
  history.push(`${appModuleUri(analysisModules.nodeDef)}${nodeDefUuid}/`)

export const checkCanSelectNodeDef = (nodeDef) => (dispatch, getState) => {
  const state = getState()
  // Check that the node def belongs to all processing chain cycles
  const processingChain = ChainState.getProcessingChain(state)
  if (NodeDef.belongsToAllCycles(Chain.getCycles(processingChain))(nodeDef)) {
    return true
  }

  const lang = I18nState.getLang(state)
  dispatch(
    NotificationActions.notifyError({
      key: 'processingChainView.cannotSelectNodeDefNotBelongingToCycles',
      params: { label: NodeDef.getLabel(nodeDef, lang) },
    })
  )
  return false
}
