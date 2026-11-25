import { Records } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as Record from '@core/record/record'
import * as NodeDef from '@core/survey/nodeDef'
import { SurveyState } from '@webapp/store/survey'
import { DialogConfirmActions, LoaderActions } from '@webapp/store/ui'
import { mergeNodesIntoFetchedRecordsCache } from '../fetchedRecordsCache'
import * as RecordState from '../state'

import * as ActionTypes from './actionTypes'

export const recordNodesUpdate =
  (nodes, removeDirtyFlag = true) =>
  (dispatch, getState) => {
    const state = getState()
    const record = RecordState.getRecord(state)
    // Hide app loader on record create
    if (A.isEmpty(Record.getNodes(record))) {
      dispatch(LoaderActions.hideLoader())
    }

    mergeNodesIntoFetchedRecordsCache(nodes)

    dispatch({ type: ActionTypes.nodesUpdate, nodes, removeDirtyFlag })
  }

export const checkAndConfirmUpdateNode = ({ dispatch, getState, node, nodeDef, onOk }) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)
  const record = RecordState.getRecord(state)
  const lang = SurveyState.getSurveyPreferredLang(state)
  const dependentEnumeratedEntityDefs = Records.findDependentEnumeratedEntityDefsNotEmpty({ survey, node, nodeDef })(
    record
  )
  const dependentEnumeratedEntityDefsLabel = dependentEnumeratedEntityDefs
    ?.map((def) => NodeDef.getLabel(def, lang))
    .join(', ')
  if (dependentEnumeratedEntityDefsLabel) {
    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: 'surveyForm:confirmUpdateDependentEnumeratedEntities',
        params: { entityDefs: dependentEnumeratedEntityDefsLabel },
        onOk,
      })
    )
  } else {
    onOk()
  }
}
