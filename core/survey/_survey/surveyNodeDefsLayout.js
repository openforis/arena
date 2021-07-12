import * as R from 'ramda'

import { uuidv4 } from '@core/uuid'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import * as SurveyNodeDefs from './surveyNodeDefs'

export const updateNodeDefParentLayout = ({ survey, surveyCycleKey, nodeDef }) => {
  const nodeDefParent = SurveyNodeDefs.getNodeDefParent(nodeDef)(survey)

  const childrenFormsInOwnPage = SurveyNodeDefs.getNodeDefChildren(nodeDefParent)(survey).filter(
    (sibling) =>
      !NodeDef.isEqual(sibling)(nodeDef) &&
      !NodeDef.isDeleted(sibling) &&
      NodeDef.isEntity(sibling) &&
      NodeDefLayout.isDisplayInOwnPage(surveyCycleKey)(sibling)
  )
  if (
    !NodeDef.isDeleted(nodeDef) &&
    NodeDefLayout.isRenderForm(surveyCycleKey)(nodeDef) &&
    NodeDefLayout.isDisplayInOwnPage(surveyCycleKey)(nodeDef)
  ) {
    childrenFormsInOwnPage.push(nodeDef)
  }
  const indexChildren = childrenFormsInOwnPage.map(NodeDef.getUuid)
  const nodeDefLayoutParent = NodeDefLayout.getLayout(nodeDefParent)

  const nodeDefLayoutParentUpdated = NodeDefLayout.assocIndexChildren(
    surveyCycleKey,
    indexChildren
  )(nodeDefLayoutParent)

  return NodeDefLayout.assocLayout(nodeDefLayoutParentUpdated)(nodeDefParent)
}

const _updateRenderType = ({ survey, surveyCycleKey, nodeDef }) => {
  const nodeDefsUpdated = {}
  const nodeDefLayout = NodeDefLayout.getLayout(nodeDef)

  if (NodeDefLayout.isRenderTable(surveyCycleKey)(nodeDef)) {
    // Assoc layout children
    const nodeDefChildren = SurveyNodeDefs.getNodeDefChildren(nodeDef)(survey)
    const nodeDefLayoutUpdated = NodeDefLayout.assocLayoutChildren(
      surveyCycleKey,
      R.map(NodeDef.getUuid, nodeDefChildren)
    )(nodeDefLayout)
    const nodeDefUpdated = NodeDefLayout.assocLayout(nodeDefLayoutUpdated)(nodeDef)
    nodeDefsUpdated[nodeDef.uuid] = nodeDefUpdated
  } else if (NodeDefLayout.isRenderForm(surveyCycleKey)(nodeDef)) {
    // dissoc layout children (valid only for table)
    let nodeDefLayoutUpdated = NodeDefLayout.dissocLayoutChildren(surveyCycleKey)(nodeDefLayout)

    // Entity rendered as form can only exists in its own page: assign pageUuid
    if (NodeDefLayout.isDisplayInParentPage(surveyCycleKey)(nodeDef)) {
      nodeDefLayoutUpdated = NodeDefLayout.assocPageUuid(surveyCycleKey, uuidv4())(nodeDefLayoutUpdated)
    }
    const nodeDefUpdated = NodeDefLayout.assocLayout(nodeDefLayoutUpdated)(nodeDef)
    nodeDefsUpdated[nodeDef.uuid] = nodeDefUpdated
  }
  // update parent layout
  const nodeDefParentUpdated = updateNodeDefParentLayout({
    survey,
    surveyCycleKey,
    nodeDef,
  })
  nodeDefsUpdated[nodeDefParentUpdated.uuid] = nodeDefParentUpdated

  return nodeDefsUpdated
}

export const updateNodeDefLayoutProp =
  ({ surveyCycleKey, nodeDef, key, value }) =>
  (survey) => {
    const nodeDefLayoutUpdated = R.pipe(
      NodeDefLayout.getLayout,
      NodeDefLayout.assocLayoutProp(surveyCycleKey, key, value)
    )(nodeDef)
    const nodeDefUpdated = NodeDefLayout.assocLayout(nodeDefLayoutUpdated)(nodeDef)
    let nodeDefsUpdated = { [nodeDefUpdated.uuid]: nodeDefUpdated }

    if (key === NodeDefLayout.keys.renderType && NodeDef.isEntity(nodeDef)) {
      nodeDefsUpdated = {
        ...nodeDefsUpdated,
        ..._updateRenderType({
          survey,
          surveyCycleKey,
          nodeDef: nodeDefUpdated,
        }),
      }
    }
    return nodeDefsUpdated
  }
