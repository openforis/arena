import * as NodeDef from '@core/survey/nodeDef'

const GRID_LAYOUT_MIN_HEIGHT_BY_NODE_DEF_TYPE = {
  [NodeDef.nodeDefType.coordinate]: ({ nodeDef }) => {
    const minHeight = 2
    const additionalFieldsNum = NodeDef.getCoordinateAdditionalFields(nodeDef).length
    if (additionalFieldsNum === 0) return minHeight
    // 1 additional field => height += 1
    // 2 or 3 additional fields => height += 2
    return minHeight + (additionalFieldsNum === 1 ? 1 : 2)
  },
  [NodeDef.nodeDefType.taxon]: () => 2,
  [NodeDef.nodeDefType.text]: ({ nodeDef }) =>
    NodeDef.getTextInputType(nodeDef) === NodeDef.textInputTypes.multiLine ? 2 : 1,
}

const GRID_LAYOUT_MAX_HEIGHT_BY_NODE_DEF_TYPE = {
  [NodeDef.nodeDefType.coordinate]: GRID_LAYOUT_MIN_HEIGHT_BY_NODE_DEF_TYPE[NodeDef.nodeDefType.coordinate],
}

const getMinGridItemHeight = ({ nodeDef }) =>
  GRID_LAYOUT_MIN_HEIGHT_BY_NODE_DEF_TYPE[NodeDef.getType(nodeDef)]?.({ nodeDef }) ?? 1

const getMaxGridItemHeight = ({ nodeDef }) =>
  GRID_LAYOUT_MAX_HEIGHT_BY_NODE_DEF_TYPE[NodeDef.getType(nodeDef)]?.({ nodeDef })

export const NodeDefLayoutSizes = {
  getMinGridItemHeight,
  getMaxGridItemHeight,
}
