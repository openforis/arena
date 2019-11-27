import * as R from 'ramda'

import {exportReducer} from '@webapp/utils/reduxUtils'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import {appUserLogout} from '@webapp/app/actions'
import {surveyCreate, surveyDelete, surveyUpdate} from '@webapp/survey/actions'
import {
  nodeDefCreate,
  nodeDefDelete,
  nodeDefPropsUpdate,
} from '@webapp/survey/nodeDefs/actions'
import {recordLoad} from '../record/actions'
import {
  formActivePageNodeDefUpdate,
  formNodeDefAddChildToUpdate,
  formPageNodeUpdate,
  formReset,
  formShowPageNavigationUpdate,
} from './actions'
import * as SurveyFormState from './surveyFormState'

const actionHandlers = {
  // Reset form
  [appUserLogout]: () => ({}),

  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [formReset]: () => ({}),

  // Form actions
  [formNodeDefAddChildToUpdate]: (state, {nodeDef}) =>
    SurveyFormState.assocNodeDefAddChildTo(nodeDef)(state),

  [formActivePageNodeDefUpdate]: (state, {nodeDef}) =>
    R.pipe(
      SurveyFormState.assocFormActivePage(nodeDef),
      SurveyFormState.assocNodeDefAddChildTo(null),
    )(state),

  [formPageNodeUpdate]: (state, {nodeDef, node}) =>
    SurveyFormState.assocFormPageNode(NodeDef.getUuid(nodeDef), node)(state),

  [formShowPageNavigationUpdate]: (state, {showPageNavigation}) =>
    SurveyFormState.setShowPageNavigation(showPageNavigation)(state),

  // Node def actions
  [nodeDefCreate]: (state, {nodeDef}) =>
    SurveyFormState.assocParamsOnNodeDefCreate(nodeDef)(state),

  [nodeDefDelete]: (state, {nodeDef}) =>
    SurveyFormState.dissocParamsOnNodeDefDelete(nodeDef)(state),

  [nodeDefPropsUpdate]: (
    state,
    {nodeDef, parentNodeDef, props, surveyCycleKey, checkFormPageUuid},
  ) => {
    if (checkFormPageUuid) {
      const pageUuid = R.path(
        [
          NodeDefLayout.keys.layout,
          surveyCycleKey,
          NodeDefLayout.keys.pageUuid,
        ],
        props,
      )
      // When changing displayIn (pageUuid) change form active page
      const activePageNodeDef = pageUuid ? nodeDef : parentNodeDef
      return SurveyFormState.assocFormActivePage(activePageNodeDef)(state)
    }

    return state
  },

  // Record
  [recordLoad]: (state, {nodeDefActivePage, formPageNodeUuidByNodeDefUuid}) =>
    R.pipe(
      SurveyFormState.assocNodeDefAddChildTo(null),
      SurveyFormState.assocFormPageNodes(formPageNodeUuidByNodeDefUuid),
      SurveyFormState.assocFormActivePage(nodeDefActivePage),
    )(state),
}

export default exportReducer(actionHandlers)
