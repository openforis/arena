import * as R from 'ramda'

import { exportReducer } from '../../../utils/reduxUtils'
import NodeDefLayout from '../../../../common/survey/nodeDefLayout'
import NodeDef from '../../../../common/survey/nodeDef'
import * as SurveyFormState from './surveyFormState'

import { appUserLogout } from '../../../app/actions'
import { surveyDelete, surveyUpdate } from '../../../survey/actions'
import {
  formActivePageNodeDefUpdate,
  formNodeDefAddChildToUpdate,
  formPageNodeUpdate,
  formReset,
  formShowPageNavigationUpdate,
} from './actions'
import { nodeDefCreate, nodeDefDelete, nodeDefPropsUpdate } from '../../../survey/nodeDefs/actions'
import { recordLoad } from '../record/actions'

const actionHandlers = {
  // reset form
  [appUserLogout]: () => ({}),

  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [formReset]: () => ({}),

  // form actions
  [formNodeDefAddChildToUpdate]: (state, { nodeDef }) => SurveyFormState.assocNodeDefAddChildTo(nodeDef)(state),

  [formActivePageNodeDefUpdate]: (state, { nodeDef }) =>
    R.pipe(
      SurveyFormState.assocFormActivePage(nodeDef),
      SurveyFormState.assocNodeDefAddChildTo(null)
    )(state),

  [formPageNodeUpdate]: (state, { nodeDef, node }) => SurveyFormState.assocFormPageNode(NodeDef.getUuid(nodeDef), node)(state),

  [formShowPageNavigationUpdate]: (state, { showPageNavigation }) => SurveyFormState.setShowPageNavigation(showPageNavigation)(state),

  // node def actions
  [nodeDefCreate]: (state, { nodeDef }) => SurveyFormState.assocParamsOnNodeDefCreate(nodeDef)(state),

  [nodeDefDelete]: (state, { nodeDef }) => SurveyFormState.dissocParamsOnNodeDefDelete(nodeDef)(state),

  [nodeDefPropsUpdate]: (state, { nodeDef, parentNodeDef, props }) => {
    const hasPageUuid = R.pipe(
      R.keys,
      R.includes(NodeDefLayout.nodeDefLayoutProps.pageUuid)
    )(props)

    if (hasPageUuid) {
      const pageUuid = props[NodeDefLayout.nodeDefLayoutProps.pageUuid]
      // when changing displayIn (pageUuid) change form active page
      const activePageNodeDef = pageUuid ? nodeDef : parentNodeDef
      return SurveyFormState.assocFormActivePage(activePageNodeDef)(state)
    } else {
      return state
    }
  },

  // record
  [recordLoad]: (state, { nodeDefActivePage, formPageNodeUuidByNodeDefUuid }) =>
    R.pipe(
      SurveyFormState.assocNodeDefAddChildTo(null),
      SurveyFormState.assocFormPageNodes(formPageNodeUuidByNodeDefUuid),
      SurveyFormState.assocFormActivePage(nodeDefActivePage)
    )(state)

}

export default exportReducer(actionHandlers)