import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'

import * as ProcessingChain from '@common/analysis/processingChain'

import { appModuleUri, analysisModules } from '@webapp/app/appModules'

import * as AppState from '@webapp/app/appState'
import * as ProcessingChainState from '@webapp/loggedin/modules/analysis/processingChain/processingChainState'

import { showNotification } from '@webapp/app/appNotification/actions'

export const navigateToNodeDefEdit = (history, nodeDefUuid) => () =>
  history.push(`${appModuleUri(analysisModules.nodeDef)}${nodeDefUuid}/`)

export const checkCanSelectNodeDef = nodeDef => (dispatch, getState) => {
  const state = getState()
  // Check that the node def belongs to all processing chain cycles
  const processingChain = ProcessingChainState.getProcessingChain(state)
  if (R.isEmpty(R.difference(ProcessingChain.getCycles(processingChain), NodeDef.getCycles(nodeDef)))) {
    return true
  }

  const lang = AppState.getLang(state)
  dispatch(
    showNotification('processingChainView.cannotSelectNodeDefNotBelongingToCycles', {
      label: NodeDef.getLabel(nodeDef, lang),
    }),
  )
  return false
}
