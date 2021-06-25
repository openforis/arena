import * as R from 'ramda'

import { uuidv4 } from '@core/uuid'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as SurveyNodeDefs from './surveyNodeDefs'

const _updateRenderType = ({ survey, surveyCycleKey, nodeDef, renderType, nodeDefLayout }) => {
  if (renderType === NodeDefLayout.renderType.table) {
    // Assoc layout children
    const nodeDefChildren = SurveyNodeDefs.getNodeDefChildren(nodeDef)(survey)
    return NodeDefLayout.assocLayoutChildren(surveyCycleKey, R.map(NodeDef.getUuid, nodeDefChildren))(nodeDefLayout)
  }

  if (renderType === NodeDefLayout.renderType.form) {
    let nodeDefLayoutUpdated = NodeDefLayout.dissocLayoutChildren(surveyCycleKey)(nodeDefLayout)

    // Entity rendered as form can only exists in its own page: assign pageUuid
    if (NodeDefLayout.isDisplayInParentPage(surveyCycleKey)(nodeDef)) {
      nodeDefLayoutUpdated = NodeDefLayout.assocPageUuid(surveyCycleKey, uuidv4())(nodeDefLayoutUpdated)

      // assign index (last child node def among node defs rendered in own page)
      const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
      const siblingsInOwnPage = Survey.getNodeDefChildren(nodeDefParent)(survey).filter((sibling) => {
        if (NodeDef.isEqual(sibling)(nodeDef)) return false
        const siblingLayout = NodeDefLayout.getLayout(sibling)
        return NodeDefLayout.isDisplayInOwnPage(surveyCycleKey)(siblingLayout)
      })
      const index = siblingsInOwnPage.length
      nodeDefLayoutUpdated = NodeDefLayout.assocIndex(surveyCycleKey, index)(nodeDefLayoutUpdated)
    }
    return nodeDefLayoutUpdated
  }

  return nodeDefLayout
}

export const updateNodeDefLayoutProp =
  ({ surveyCycleKey, nodeDef, key, value }) =>
  (survey) => {
    let nodeDefLayoutUpdated = R.pipe(
      NodeDefLayout.getLayout,
      NodeDefLayout.assocLayoutProp(surveyCycleKey, key, value)
    )(nodeDef)

    if (key === NodeDefLayout.keys.renderType && NodeDef.isEntity(nodeDef))
      nodeDefLayoutUpdated = _updateRenderType({
        survey,
        surveyCycleKey,
        nodeDef,
        nodeDefLayout: nodeDefLayoutUpdated,
        renderType: value,
      })

    const nodeDefUpdated = NodeDefLayout.assocLayout(nodeDefLayoutUpdated)(nodeDef)
    return SurveyNodeDefs.assocNodeDef(nodeDefUpdated)(survey)
  }
