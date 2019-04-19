import * as R from 'ramda'

import Survey from '../../../../common/survey/survey'
import NodeDef from '../../../../common/survey/nodeDef'
import Record from '../../../../common/record/record'
import Node from '../../../../common/record/node'

import * as SurveyState from '../../../survey/surveyState'
import * as RecordState from '../record/recordState'
import * as SurveyFormState from './surveyFormState'

/**
 * ==== SURVEY-FORM EDIT MODE - NODE DEFS EDIT
 */

export const formReset = 'survey/form/reset'

export const resetForm = () => dispatch =>
  dispatch({ type: formReset })

// ====== nodeDef edit
export const formNodeDefEditUpdate = 'survey/form/nodeDef/edit/update'
export const formNodeDefAddChildToUpdate = 'survey/form/nodeDef/addChildTo/update'

// set current nodeDef edit
export const setFormNodeDefEdit = nodeDef => dispatch =>
  dispatch({ type: formNodeDefEditUpdate, nodeDef })

// reset current nodeDef edit
export const closeFormNodeDefEdit = () => async dispatch =>
  dispatch({ type: formNodeDefEditUpdate, nodeDef: null })

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

// ==== utils

export const getNodeKeyLabelValues = nodeEntity => (dispatch, getState) => {
  const state = getState()

  const survey = SurveyState.getSurvey(state)
  const surveyForm = SurveyFormState.getSurveyForm(state)
  const record = RecordState.getRecord(surveyForm)
  const lang = R.pipe(Survey.getSurveyInfo, Survey.getDefaultLanguage)(survey)

  const nodeKeys = R.pipe(
    Node.getNodeDefUuid,
    nodeDefUuid => Survey.getNodeDefByUuid(nodeDefUuid)(survey),
    nodeDef => Survey.getNodeDefKeys(nodeDef)(survey),
    R.map(nodeDefKey => {
        const nodeDefKeyUuid = NodeDef.getUuid(nodeDefKey)
        return R.pipe(
          Record.getNodeChildrenByDefUuid(nodeEntity, nodeDefKeyUuid),
          R.head,
          n => {
            const label = NodeDef.getLabel(nodeDefKey, lang)
            const value = Node.getValue(n, '')
            return `${label} - ${value}`
          }
        )(record)
      }
    ),
    R.join(', ')
  )(nodeEntity)

  return nodeKeys
}