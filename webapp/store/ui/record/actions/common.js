import { Surveys } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'

import { DialogConfirmActions, LoaderActions } from '@webapp/store/ui'
import { SurveyState } from '@webapp/store/survey'

import * as RecordState from '../state'
import * as ActionTypes from './actionTypes'

export const recordNodesUpdate = (nodes) => (dispatch, getState) => {
  const record = RecordState.getRecord(getState())
  // Hide app loader on record create
  if (A.isEmpty(Record.getNodes(record))) {
    dispatch(LoaderActions.hideLoader())
  }

  dispatch({ type: ActionTypes.nodesUpdate, nodes: nodes })
}

export const checkAndConfirmUpdateNode = ({ dispatch, getState, nodeDef, onOk }) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)
  const lang = SurveyState.getSurveyPreferredLang(state)
  const dependentEnumeratedEntityDefs = NodeDef.isCode(nodeDef)
    ? Surveys.getDependentEnumeratedEntityDefs({ survey, nodeDef })
    : null
  const dependentEnumeratedEntityDefsLabel = dependentEnumeratedEntityDefs
    ?.map((def) => NodeDef.getLabel(def, lang))
    .join(', ')
  if (dependentEnumeratedEntityDefsLabel) {
    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: 'surveyForm.confirmUpdateDependentEnumeratedEntities',
        params: { entityDefs: dependentEnumeratedEntityDefsLabel },
        onOk: onOk,
      })
    )
  } else {
    onOk()
  }
}
