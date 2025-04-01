import { Records, SurveyDependencyType, Surveys } from '@openforis/arena-core'

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

const findApplicableDependentEnumeratedEntityDefs = ({ survey, nodeDef }) => {
  const result = []
  const visitedNodeDefsByUuid = {}
  const stack = [nodeDef]
  while (stack.length > 0) {
    const currentNodeDef = stack.pop()
    const currentNodeDefUuid = NodeDef.getUuid(currentNodeDef)
    if (!visitedNodeDefsByUuid[currentNodeDefUuid]) {
      if (NodeDef.isEntity(currentNodeDef) && NodeDef.isEnumerate(currentNodeDef)) {
        result.push(currentNodeDef)
      }
      const dependentsApplicable = Surveys.getNodeDefDependents({
        survey,
        nodeDefUuid: currentNodeDefUuid,
        dependencyType: SurveyDependencyType.applicable,
      })
      const dependentsDefaultValues = Surveys.getNodeDefDependents({
        survey,
        nodeDefUuid: currentNodeDefUuid,
        dependencyType: SurveyDependencyType.defaultValues,
      })
      const allDependents = [...dependentsApplicable, ...dependentsDefaultValues]
      allDependents.forEach((dependent) => {
        if (!visitedNodeDefsByUuid[NodeDef.getUuid(dependent)]) {
          stack.push(dependent)
        }
      })
    }
    visitedNodeDefsByUuid[currentNodeDefUuid] = true
  }
  return result
}

const findDependentEnumeratedEntityDefsNotEmpty = ({ survey, record, node, nodeDef }) => {
  const dependentEnumeratedEntityDefs = NodeDef.isCode(nodeDef)
    ? Surveys.getDependentEnumeratedEntityDefs({ survey, nodeDef })
    : []

  const applicableDependentEnumeratedEntityDefs = findApplicableDependentEnumeratedEntityDefs({ survey, nodeDef })
  dependentEnumeratedEntityDefs.push(...applicableDependentEnumeratedEntityDefs)

  if (dependentEnumeratedEntityDefs.length === 0) return []

  const parentNode = Records.getParent(node)(record)

  return dependentEnumeratedEntityDefs.filter((dependentEnumeratedEntityDef) => {
    const dependentEntities = Records.getDescendantsOrSelf({
      record,
      node: parentNode,
      nodeDefDescendant: dependentEnumeratedEntityDef,
    })
    const dependentEntitiesNotEmpty = dependentEntities.filter((dependentEntity) =>
      Records.getChildren(dependentEntity)(record).some((childNode) => Record.isNodeFilledByUser(childNode)(record))
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
