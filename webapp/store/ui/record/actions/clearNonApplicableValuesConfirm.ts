import { DialogConfirmActions } from '@webapp/store/ui/dialogConfirm'
import { SurveyState } from '@webapp/store/survey'

import * as ActionTypes from './actionTypes'
import { getNodeDefLabelsToShow, prepareNodesToRestore } from './clearNonApplicableValuesConfirmUtils'
import { recordNodesUpdate } from './common'
import { deleteNodeClearNonApplicableValuesConfirmed } from './delete'
import { persistNodeClearNonApplicableValuesConfirmed } from './update'

export type ClearNonApplicableValuesConfirmContent = {
  recordUuid: string
  nodeDelete: boolean
  node?: any
  nodeUuid?: string
  nodeDefUuidsToClear: string[]
  nodesToRestore: any[]
  nodeUuidsToRemove: string[]
}

// restores the nodes as stored on the server, replacing the ones updated or deleted locally before sending the request
const revertLocalUpdate =
  ({ nodesToRestore, nodeUuidsToRemove }: ClearNonApplicableValuesConfirmContent) =>
  (dispatch) => {
    for (const nodeUuid of nodeUuidsToRemove) {
      dispatch({ type: ActionTypes.nodeDelete, node: { uuid: nodeUuid } })
    }
    if (nodesToRestore.length > 0) {
      dispatch(recordNodesUpdate(prepareNodesToRestore(nodesToRestore)))
    }
  }

/**
 * Asks the user to confirm a node update or deletion that would clear the values of attributes becoming non-applicable.
 * If confirmed, the request is sent again; otherwise, the local changes are reverted.
 * @param {!object} content - The content of the WebSocket event sent by the server.
 * @returns {Function} - The thunk action.
 */
export const confirmClearNonApplicableValues =
  (content: ClearNonApplicableValuesConfirmContent) =>
  (dispatch, getState): void => {
    const state = getState()
    const survey = SurveyState.getSurvey(state)
    const lang = SurveyState.getSurveyPreferredLang(state)
    const { nodeDelete, node, nodeUuid, nodeDefUuidsToClear } = content

    const nodeDefLabels = getNodeDefLabelsToShow({ survey, lang, nodeDefUuidsToClear })

    const onOk = nodeDelete
      ? deleteNodeClearNonApplicableValuesConfirmed(nodeUuid)
      : persistNodeClearNonApplicableValuesConfirmed(node)

    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: 'surveyForm:confirmClearNonApplicableValues',
        params: { nodeDefLabels: nodeDefLabels.join('\n') },
        onOk,
        dismissable: true,
        onCancel: revertLocalUpdate(content),
      })
    )
  }
