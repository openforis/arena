import { Records, Surveys } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'

import { DialogConfirmActions, LoaderActions } from '@webapp/store/ui'
import { SurveyState } from '@webapp/store/survey'

import * as RecordState from '../state'
import * as ActionTypes from './actionTypes'

export const recordNodesUpdate = (nodes) => (dispatch, getState) => {
  const state = getState()
  const record = RecordState.getRecord(state)
  // Hide app loader on record create
  if (A.isEmpty(Record.getNodes(record))) {
    dispatch(LoaderActions.hideLoader())
  }

  dispatch({ type: ActionTypes.nodesUpdate, nodes: nodes })
}

const findDependentEnumeratedEntityDefsNotEmpty = ({ survey, record, node, nodeDef }) => {
  const dependentEnumeratedEntityDefs = NodeDef.isCode(nodeDef)
    ? Surveys.getDependentEnumeratedEntityDefs({ survey, nodeDef })
    : null

  if (!dependentEnumeratedEntityDefs) return []

  const parentNode = Records.getParent(node)(record)

  return dependentEnumeratedEntityDefs.filter((dependentEnumeratedEntityDef) => {
    const dependentEntities = Records.getDescendantsOrSelf({
      record,
      node: parentNode,
      nodeDefDescendant: dependentEnumeratedEntityDef,
    })
    const dependentEntitiesNotEmpty = dependentEntities.filter((dependentEntity) =>
      Records.getChildren(dependentEntity)(record).some((childNode) =>
        Record.isNodeFilledByUser({ survey, node: childNode })(record)
      )
    )
    return dependentEntitiesNotEmpty.length > 0
  })
}

export const checkAndConfirmUpdateNode = ({ dispatch, getState, node, nodeDef, onOk }) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)
  const record = RecordState.getRecord(state)
  const lang = SurveyState.getSurveyPreferredLang(state)
  const dependentEnumeratedEntityDefs = findDependentEnumeratedEntityDefsNotEmpty({ survey, record, node, nodeDef })

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
