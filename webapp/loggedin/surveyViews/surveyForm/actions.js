import Survey from '../../../../common/survey/survey'
import NodeDef from '../../../../common/survey/nodeDef'
import Record from '../../../../common/record/record'
import Node from '../../../../common/record/node'

import * as AppState from '../../../app/appState'
import * as SurveyState from '../../../survey/surveyState'
import * as RecordState from '../record/recordState'
import * as SurveyFormState from './surveyFormState'

/**
 * ==== SURVEY-FORM EDIT MODE - NODE DEFS EDIT
 */

export const formReset = 'survey/form/reset'

export const resetForm = () => dispatch =>
  dispatch({ type: formReset })

export const formNodeDefAddChildToUpdate = 'survey/form/nodeDef/addChildTo/update'

// set current nodeDef unlocked
export const setFormNodeDefAddChildTo = nodeDef => dispatch =>
  dispatch({ type: formNodeDefAddChildToUpdate, nodeDef })

// current nodeDef of active form page
export const formActivePageNodeDefUpdate = 'survey/form/activePageNodeDef/update'

export const setFormActivePage = (nodeDef) => dispatch =>
  dispatch({ type: formActivePageNodeDefUpdate, nodeDef })

// current node of active form page
export const formPageNodeUpdate = 'survey/form/pageNode/update'

export const setFormPageNode = (nodeDef, node) => dispatch =>
  dispatch({ type: formPageNodeUpdate, nodeDef, node })

// toggle form page navigation
export const formShowPageNavigationUpdate = 'survey/form/showPageNavigation/update'

export const toggleFormPageNavigation = () => (dispatch, getState) => {
  const showPageNavigation = !SurveyFormState.showPageNavigation(getState())
  dispatch({ type: formShowPageNavigationUpdate, showPageNavigation })
}

// ==== utils

export const getNodeKeyLabelValues = (nodeDef, nodeEntity) => (dispatch, getState) => {
  const state = getState()

  const survey = SurveyState.getSurvey(state)
  const record = RecordState.getRecord(state)
  const lang = Survey.getLanguage(AppState.getLang(state))(survey)
  const nodeDefKeys = Survey.getNodeDefKeys(nodeDef)(survey)

  const getNodeDefKeyLabelValue = nodeDefKey => {
    const nodeKey = Record.getNodeChildByDefUuid(nodeEntity, NodeDef.getUuid(nodeDefKey))(record)
    const label = NodeDef.getLabel(nodeDefKey, lang)
    const value = Node.getValue(nodeKey, '')
    return `${label} - ${value}`
  }

  return nodeDefKeys.map(getNodeDefKeyLabelValue).join(', ')
}
