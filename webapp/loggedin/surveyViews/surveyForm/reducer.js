import * as R from 'ramda'

import { exportReducer } from '../../../utils/reduxUtils'

import NodeDefLayout from '../../../../common/survey/nodeDefLayout'

import { appUserLogout } from '../../../app/actions'

import { surveyDelete, surveyUpdate } from '../../../survey/actions'

import {
  formActivePageNodeDefUpdate,
  formNodeDefEditUpdate,
  formNodeDefAddChildToUpdate,
  formPageNodeUpdate,
  formReset
} from './actions'

import { nodeDefCreate, nodeDefPropsUpdate } from '../../../survey/nodeDefs/actions'

import {
  assocFormActivePage,
  assocFormNodeDefEdit,
  assocFormPageNode,
  assocFormPageNodes,
  assocNodeDefAddChildTo,
  assocParamsOnNodeDefCreate,
} from './surveyFormState'

import { recordLoad } from '../record/actions'

const actionHandlers = {
  // reset form
  [appUserLogout]: () => ({}),

  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [formReset]: () => ({}),

  // form actions
  [formNodeDefEditUpdate]: (state, { nodeDef }) => assocFormNodeDefEdit(nodeDef)(state),

  [formNodeDefAddChildToUpdate]: (state, { nodeDef }) => assocNodeDefAddChildTo(nodeDef)(state),

  [formActivePageNodeDefUpdate]: (state, { nodeDef }) =>
    R.pipe(
      assocFormActivePage(nodeDef),
      assocNodeDefAddChildTo(null)
    )(state),

  [formPageNodeUpdate]: (state, { nodeDef, node }) => assocFormPageNode(nodeDef, node)(state),

  // node def
  [nodeDefCreate]: (state, { nodeDef }) => assocParamsOnNodeDefCreate(nodeDef)(state),

  [nodeDefPropsUpdate]: (state, { nodeDef, parentNodeDef, props }) => {
    const hasPageUuid = R.pipe(
      R.keys,
      R.includes(NodeDefLayout.nodeDefLayoutProps.pageUuid)
    )(props)

    if (hasPageUuid) {
      const pageUuid = props[NodeDefLayout.nodeDefLayoutProps.pageUuid]
      // when changing displayIn (pageUuid) change form active page
      const activePageNodeDef = pageUuid ? nodeDef : parentNodeDef
      return assocFormActivePage(activePageNodeDef)(state)
    } else {
      return state
    }
  },

  // record
  [recordLoad]: (state, { nodeDefActivePage, formPageNodeUuidByNodeDefUuid }) =>
    R.pipe(
      assocNodeDefAddChildTo(null),
      assocFormPageNodes(formPageNodeUuidByNodeDefUuid),
      assocFormActivePage(nodeDefActivePage)
    )(state)

}

export default  exportReducer(actionHandlers)


