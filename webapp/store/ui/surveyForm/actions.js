import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import * as CategoryItem from '@core/survey/categoryItem'
import * as Taxon from '@core/survey/taxon'

import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'

import { SurveyState } from '@webapp/store/survey'
import { RecordState } from '@webapp/store/ui/record'
import * as SurveyFormState from './state'

/**
 * ==== SURVEY-FORM EDIT MODE - NODE DEFS EDIT.
 */

export const formReset = 'survey/form/reset'
export const resetForm = () => (dispatch) => dispatch({ type: formReset })

export const formNodeDefAddChildToUpdate = 'survey/form/nodeDef/addChildTo/update'

// Set current nodeDef unlocked
export const setFormNodeDefAddChildTo = (nodeDef) => (dispatch) =>
  dispatch({ type: formNodeDefAddChildToUpdate, nodeDef })

// Current nodeDef of active form page
export const formActivePageNodeDefUpdate = 'survey/form/activePageNodeDef/update'

export const setFormActivePage =
  ({ nodeDef, showAddChildTo = false }) =>
  (dispatch) =>
    dispatch({ type: formActivePageNodeDefUpdate, nodeDef, showAddChildTo })

// Current node of active form page
export const formPageNodesUpdate = 'survey/form/pageNodes/update'

// Sets the node (entity) for a page (identified by the entity def)
// and reset the node set for the descendant entity defs.
export const setFormPageNode = (nodeDef, nodeUuid) => (dispatch, getState) => {
  const state = getState()
  const cycle = SurveyState.getSurveyCycleKey(state)
  const survey = SurveyState.getSurvey(state)
  const formPageNodeUuidByNodeDefUuid = {}

  Survey.visitDescendantsAndSelf({
    nodeDef,
    visitorFn: (descendantNodeDef) => {
      if (NodeDef.isEntity(descendantNodeDef) && NodeDefLayout.hasPage(cycle)(descendantNodeDef)) {
        const formPageNodeUuid = NodeDef.isEqual(descendantNodeDef)(nodeDef) ? nodeUuid : null
        formPageNodeUuidByNodeDefUuid[NodeDef.getUuid(descendantNodeDef)] = formPageNodeUuid
      }
    },
  })(survey)

  dispatch({ type: formPageNodesUpdate, formPageNodeUuidByNodeDefUuid })
}

// Toggle form page navigation
export const formShowPageNavigationUpdate = 'survey/form/showPageNavigation/update'

export const toggleFormPageNavigation = () => (dispatch, getState) => {
  const showPageNavigation = !SurveyFormState.showPageNavigation(getState())
  dispatch({ type: formShowPageNavigationUpdate, showPageNavigation })
}

// Toggle form page navigation expanded
export const formExpandedPageNavigationUpdate = 'survey/form/expandedPageNavigation/update'

export const toggleExpandedFormPageNavigation = () => (dispatch, getState) => {
  const expandedPageNavigation = !SurveyFormState.expandedPageNavigation(getState())
  dispatch({ type: formExpandedPageNavigationUpdate, expandedPageNavigation })
}

// toggle form nodeDef label function
export const formUpdateNodeDefLabelType = 'survey/form/updateNodeDefLabelType/update'
export const updateNodeDefLabelType = () => (dispatch, getState) => {
  const nodeDefLabelType = SurveyFormState.getNodeDefLabelType(getState())

  dispatch({
    type: formUpdateNodeDefLabelType,
    nodeDefLabelType:
      nodeDefLabelType === NodeDef.NodeDefLabelTypes.label
        ? NodeDef.NodeDefLabelTypes.name
        : NodeDef.NodeDefLabelTypes.label,
  })
}

// ==== utils

const _getNodeValueString = ({ nodeDef, node, lang }) => {
  if (NodeDef.isCode(nodeDef)) {
    const categoryItem = NodeRefData.getCategoryItem(node)
    return categoryItem ? CategoryItem.getLabel(lang)(categoryItem) : ''
  }
  if (NodeDef.isTaxon(nodeDef)) {
    const taxon = NodeRefData.getTaxon(node)
    return taxon ? Taxon.getCode(taxon) : ''
  }
  return Node.getValue(node, '')
}

export const getNodeKeyLabelValues = (nodeDef, nodeEntity) => (_dispatch, getState) => {
  const state = getState()

  const survey = SurveyState.getSurvey(state)
  const lang = SurveyState.getSurveyPreferredLang(state)
  const record = RecordState.getRecord(state)
  const nodeDefKeys = Survey.getNodeDefKeys(nodeDef)(survey)

  const getNodeDefKeyLabelValue = (nodeDefKey) => {
    const label = NodeDef.getLabel(nodeDefKey, lang)
    const nodeKey = Record.getNodeChildByDefUuid(nodeEntity, NodeDef.getUuid(nodeDefKey))(record)
    const value = _getNodeValueString({ nodeDef: nodeDefKey, node: nodeKey, lang })
    return `${label}: ${value}`
  }

  return nodeDefKeys.map(getNodeDefKeyLabelValue).join(', ')
}
