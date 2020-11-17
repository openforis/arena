import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Taxon from '@core/survey/taxon'

import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'

import { I18nState } from '@webapp/store/system'
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

export const setFormActivePage = (nodeDef) => (dispatch) => dispatch({ type: formActivePageNodeDefUpdate, nodeDef })

// Current node of active form page
export const formPageNodeUpdate = 'survey/form/pageNode/update'

export const setFormPageNode = (nodeDef, node) => (dispatch) => dispatch({ type: formPageNodeUpdate, nodeDef, node })

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
export const formUpdateNodeDefDisplayType = 'survey/form/updateNodeDefDisplayType/update'
export const updateNodeDefDisplayType = () => (dispatch, getState) => {
  const nodeDefDisplayType = SurveyFormState.getNodeDefDisplayType(getState())

  dispatch({
    type: formUpdateNodeDefDisplayType,
    nodeDefDisplayType:
      nodeDefDisplayType === NodeDef.NodeDefLabelTypes.label
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

export const getNodeKeyLabelValues = (nodeDef, nodeEntity) => (dispatch, getState) => {
  const state = getState()

  const lang = I18nState.getLang(state)
  const survey = SurveyState.getSurvey(state)
  const record = RecordState.getRecord(state)
  const nodeDefKeys = Survey.getNodeDefKeys(nodeDef)(survey)

  const getNodeDefKeyLabelValue = (nodeDefKey) => {
    const nodeKey = Record.getNodeChildByDefUuid(nodeEntity, NodeDef.getUuid(nodeDefKey))(record)
    const label = SurveyState.getNodeDefLabel(nodeDefKey)(state)
    const value = _getNodeValueString({ nodeDef: nodeDefKey, node: nodeKey, lang })
    return `${label} - ${value}`
  }

  return nodeDefKeys.map(getNodeDefKeyLabelValue).join(', ')
}
