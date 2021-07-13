import * as R from 'ramda'

import { uuidv4 } from '@core/uuid'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import * as SurveyNodeDefs from './_survey/surveyNodeDefs'

const _updateParentLayoutChildrenFormsIndex = ({ survey, surveyCycleKey, nodeDef }) => {
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

  const nodeDefParentUpdated = NodeDefLayout.updateLayout((layout) => {
    const layoutUpdated = NodeDefLayout.assocIndexChildren(surveyCycleKey, indexChildren)(layout)
    return layoutUpdated
  })(nodeDefParent)
  return nodeDefParentUpdated
}

const _updateRenderType = ({ survey, surveyCycleKey, nodeDef }) => {
  const nodeDefsUpdated = {}

  if (NodeDefLayout.isRenderTable(surveyCycleKey)(nodeDef)) {
    // Assoc layout children
    const nodeDefChildren = SurveyNodeDefs.getNodeDefChildren(nodeDef)(survey)
    const nodeDefUpdated = NodeDefLayout.updateLayout((layout) => {
      const layoutUpdated = NodeDefLayout.assocLayoutChildren(
        surveyCycleKey,
        nodeDefChildren.map(NodeDef.getUuid)
      )(layout)
      return layoutUpdated
    })(nodeDef)
    nodeDefsUpdated[nodeDef.uuid] = nodeDefUpdated
  } else if (NodeDefLayout.isRenderForm(surveyCycleKey)(nodeDef)) {
    const nodeDefUpdated = NodeDefLayout.updateLayout((layout) => {
      // dissoc layout children (valid only for table)
      let nodeDefLayoutUpdated = NodeDefLayout.dissocLayoutChildren(surveyCycleKey)(layout)

      // Entity rendered as form can only exists in its own page: assign pageUuid
      if (NodeDefLayout.isDisplayInParentPage(surveyCycleKey)(nodeDef)) {
        nodeDefLayoutUpdated = NodeDefLayout.assocPageUuid(surveyCycleKey, uuidv4())(nodeDefLayoutUpdated)
      }
      return nodeDefLayoutUpdated
    })(nodeDef)
    nodeDefsUpdated[nodeDef.uuid] = nodeDefUpdated
  }
  // update parent layout (children forms index)
  const nodeDefParentUpdated = _updateParentLayoutChildrenFormsIndex({
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

const nodeDefLayoutHeights = {
  [NodeDef.nodeDefType.coordinate]: 2,
  [NodeDef.nodeDefType.taxon]: 2,
}

/**
 * Adds the layout for the specified cycle to a node def.
 * If the node def was associated already to a cycle, it copies the layout props from that cycle
 * into the new one, otherwise it sets default layout props to the new cycle.
 *
 * @param {!object} params - The update parameters.
 * @param {!object} [params.survey] - The survey object.
 * @param {!object} [params.nodeDef] - The node definition to update.
 * @param {!string} [params.cycle] - The survey cycle to add to the nodeDef.
 * @param {string} [params.cyclePrev=null] - The previous survey cycle (if any).
 *
 * @returns {object} - The updated node def.
 * */
const _addLayoutForCycle = async ({ nodeDef, cycle, cyclePrev = null }) => {
  if (cyclePrev) {
    // If cycle prev exists, copy layout from previous cycle
    const nodeDefUpdated = NodeDefLayout.updateLayout((layout) => {
      const layoutCyclePrev = NodeDefLayout.getLayoutCycle(cyclePrev)(nodeDef)
      const layoutUpdated = NodeDefLayout.assocLayoutCycle(cycle, layoutCyclePrev)(layout)
      return layoutUpdated
    })(nodeDef)
    return nodeDefUpdated
  }
  // previous cycle does not exist: set the default layout
  const nodeDefUpdated = NodeDefLayout.updateLayout((layout) => {
    const layoutUpdated = R.mergeLeft(
      // TODO use NodeDefLayout default props layout
      NodeDef.isEntity(nodeDef)
        ? NodeDefLayout.newLayout(cycle, NodeDefLayout.renderType.form, uuidv4())
        : NodeDefLayout.newLayout(cycle, NodeDefLayout.renderType.checkbox)
    )(layout)
    return layoutUpdated
  })(nodeDef)
  return nodeDefUpdated
}

const _updateParentLayoutForCycle = ({ survey, nodeDefParent, nodeDef, cycle, updateFn }) => {
  const nodeDefParentUpdated = NodeDefLayout.updateLayout((layout) => {
    const layoutCycleUpdated = updateFn({ survey, cycle, nodeDefParent, nodeDef })
    const layoutUpdated = NodeDefLayout.assocLayoutCycle(cycle, layoutCycleUpdated)(layout)
    return layoutUpdated
  })(nodeDefParent)
  return nodeDefParentUpdated
}

const _calculateChildPagesIndex = ({ survey, cycle, nodeDefParent }) => {
  const childrenFormsInOwnPage = SurveyNodeDefs.getNodeDefChildren(nodeDefParent)(survey).filter(
    (sibling) =>
      !NodeDef.isDeleted(sibling) && NodeDef.isEntity(sibling) && NodeDefLayout.isDisplayInOwnPage(cycle)(sibling)
  )
  return childrenFormsInOwnPage.map(NodeDef.getUuid)
}

const _getOrInitializeChildPagesIndex = ({ survey, cycle, nodeDefParent }) => {
  const childrenFormsIndexPrev = NodeDefLayout.getIndexChildren(cycle)(nodeDefParent)
  if (childrenFormsIndexPrev.length > 0) {
    return childrenFormsIndexPrev
  }
  // initialize children forms index, if empty
  return _calculateChildPagesIndex({ survey, cycle, nodeDefParent })
}

export const initializeParentLayout = ({ survey, cycle, nodeDefParent }) => {
  const index = _calculateChildPagesIndex({ survey, cycle, nodeDefParent })
  const nodeDefParentUpdated = NodeDefLayout.updateLayout((layout) => {
    const layoutUpdated = NodeDefLayout.assocIndexChildren(cycle, index)(layout)
    return layoutUpdated
  })(nodeDefParent)
  return nodeDefParentUpdated
}

const _addNodeDefInParentLayoutCycle = ({ survey, cycle, nodeDefParent, nodeDef }) => {
  const layoutForCycle = NodeDefLayout.getLayoutCycle(cycle)(nodeDefParent)

  const nodeDefUuid = NodeDef.getUuid(nodeDef)

  const childPagesIndexPrev = _getOrInitializeChildPagesIndex({ survey, cycle, nodeDefParent })

  const layoutChildrenPrev = NodeDefLayout.getLayoutChildren(cycle)(nodeDefParent)

  if (NodeDefLayout.isRenderTable(cycle)(nodeDefParent)) {
    // Add or node def to children (render as table)
    return {
      ...layoutForCycle,
      [NodeDefLayout.keys.layoutChildren]: R.append(nodeDefUuid)(layoutChildrenPrev),
    }
  }
  // render as form
  if (NodeDefLayout.hasPage(cycle)(nodeDef)) {
    // Node def displayed in its own page
    const childPagesIndexUpdated = [...childPagesIndexPrev, nodeDefUuid]
    return { ...layoutForCycle, [NodeDefLayout.keys.indexChildren]: childPagesIndexUpdated }
  }
  // render as form in current page (grid layout)
  // Add new node to the bottom left corner of the form (x = 0, y = max value of every child layout y + h or 0)
  const y = R.reduce((accY, layoutChild) => R.max(accY, layoutChild.y + layoutChild.h), 0, layoutForCycle)
  // New node def height depends on its type
  const h = R.propOr(1, NodeDef.getType(nodeDef), nodeDefLayoutHeights)
  return {
    ...layoutForCycle,
    [NodeDefLayout.keys.layoutChildren]: R.append({ i: nodeDefUuid, x: 0, y, w: 1, h })(layoutChildrenPrev),
  }
}

const _removeNodeDefFromParentLayoutCycle = ({ survey, cycle, nodeDefParent, nodeDef }) => {
  const layoutForCycle = NodeDefLayout.getLayoutCycle(cycle)(nodeDefParent)

  const nodeDefUuid = NodeDef.getUuid(nodeDef)

  const layoutChildrenPrev = NodeDefLayout.getLayoutChildren(cycle)(nodeDefParent)

  if (NodeDefLayout.isRenderTable(cycle)(nodeDefParent)) {
    // Remove node def from children (render as table)
    const layoutChildrenUpdated = R.without([nodeDefUuid])(layoutChildrenPrev)
    return { ...layoutForCycle, [NodeDefLayout.keys.layoutChildren]: layoutChildrenUpdated }
  }
  // render as form

  const childrenPagesIndexPrev = _getOrInitializeChildPagesIndex({ survey, cycle, nodeDefParent })

  if (NodeDefLayout.hasPage(cycle)(nodeDef)) {
    // Node def displayed in its own page
    const childrenPagesIndexUpdated = R.without([nodeDefUuid])(childrenPagesIndexPrev)
    return { ...layoutForCycle, [NodeDefLayout.keys.indexChildren]: childrenPagesIndexUpdated }
  }
  // render as form in current page (grid layout)
  // Remove node def from children
  const layoutForCycleUpdated = {
    ...layoutForCycle,
    [NodeDefLayout.keys.layoutChildren]: R.reject(R.propEq('i', nodeDefUuid), layoutChildrenPrev),
  }
  return layoutForCycleUpdated
}

/**
 * Updates the parent node definition layout after survey cycles have been added or removed from a node definition.
 *
 * @param {!object} params - The update parameters.
 * @param {!object} [params.survey] - The survey object.
 * @param {!object} [params.nodeDef] - The node definition that has just been updated.
 * @param {Array.<string>} [params.cyclesAdded = []] - The survey cycles added to the nodeDef.
 * @param {Array.<string>} [params.cyclesDeleted = []] - The survey cycles removed from the nodeDef.
 *
 * @returns {object} - The updated parent node definition, if changes have been applied.
 * */
export const updateParentLayout = ({ survey, nodeDef, cyclesAdded = [], cyclesDeleted = [] }) => {
  if (NodeDef.isRoot(nodeDef) || NodeDef.isVirtual(nodeDef)) return {}

  const nodeDefParent = SurveyNodeDefs.getNodeDefParent(nodeDef)(survey)

  let surveyUpdated = { ...survey }
  let nodeDefParentUpdated = { ...nodeDefParent }

  // update layout in added cycles
  cyclesAdded.forEach((cycle) => {
    nodeDefParentUpdated = _updateParentLayoutForCycle({
      survey: surveyUpdated,
      cycle,
      nodeDefParent: nodeDefParentUpdated,
      nodeDef,
      updateFn: _addNodeDefInParentLayoutCycle,
    })
    surveyUpdated = SurveyNodeDefs.assocNodeDef({ nodeDef: nodeDefParentUpdated })
  })

  // update layout of removed cycles
  cyclesDeleted.forEach((cycle) => {
    nodeDefParentUpdated = _updateParentLayoutForCycle({
      survey: surveyUpdated,
      cycle,
      nodeDefParent: nodeDefParentUpdated,
      nodeDef,
      updateFn: _removeNodeDefFromParentLayoutCycle,
    })
    surveyUpdated = SurveyNodeDefs.assocNodeDef({ nodeDef: nodeDefParentUpdated })
  })

  // Update parent node def layout in DB (if changed)
  const nodeDefParentLayout = NodeDefLayout.getLayout(nodeDefParent)
  const nodeDefParentLayoutUpdated = NodeDefLayout.getLayout(nodeDefParentUpdated)

  if (R.equals(nodeDefParentLayout, nodeDefParentLayoutUpdated)) {
    // no changes applied
    return null
  }
  return nodeDefParentUpdated
}

/**
 * Updates the layout of a node definition and its parent after its survey cycles have been changed.
 * If the node definition is an entity, updates even the cycles of the descendant node definitions.
 *
 * @param {!object} params - The update parameters.
 * @param {!object} [params.survey] - The survey object.
 * @param {!string} [params.nodeDefUuid] - The UUID of the node definition to update.
 * @param {Array.<string>} [params.cycles] - The survey cycles associated to the node definition.
 *
 * @returns {object} - The updated node defs, returned as an object index by UUID.
 * */
export const updateLayoutOnCyclesUpdate = ({ survey, nodeDefUuid, cycles }) => {
  const nodeDef = SurveyNodeDefs.getNodeDefByUuid(nodeDefUuid)(survey)

  const cyclesPrev = NodeDef.getCycles(nodeDef)
  const cyclesAdded = R.difference(cycles, cyclesPrev)
  const cyclesDeleted = R.difference(cyclesPrev, cycles)

  const nodeDefsUpdated = {}

  // Update nodeDef cycles layout
  if (cyclesAdded.length > 0) {
    const cyclesAddedInfo = cycles
      .map((cycle, i) => ({ cycle, cyclePrev: cycles[i - 1] }))
      .filter((cycleInfo) => cyclesAdded.includes(cycleInfo.cycle))

    const nodeDefUpdated = cyclesAddedInfo.reduce(
      (nodeDefUpdatedAcc, { cycle, cyclePrev }) => _addLayoutForCycle({ nodeDef: nodeDefUpdatedAcc, cycle, cyclePrev }),
      nodeDef
    )
    nodeDefsUpdated[nodeDef.uuid] = nodeDefUpdated
  }
  // remove layout for deleted cycles
  if (cyclesDeleted.some((cycleDeleted) => NodeDefLayout.hasLayoutCycle(cycleDeleted)(nodeDef))) {
    const nodeDefUpdated = NodeDefLayout.updateLayout((layout) => {
      const layoutUpdated = NodeDefLayout.dissocLayoutCycles(cyclesDeleted)(layout)
      return layoutUpdated
    })(nodeDef)
    nodeDefsUpdated[nodeDefUpdated.uuid] = nodeDefUpdated
  }

  let surveyUpdated = SurveyNodeDefs.mergeNodeDefs(nodeDefsUpdated)(survey)

  // update parent layout
  const nodeDefParentUpdated = updateParentLayout({ survey: surveyUpdated, nodeDef, cyclesAdded, cyclesDeleted })
  if (nodeDefParentUpdated) {
    nodeDefsUpdated[nodeDefParentUpdated.uuid] = nodeDefParentUpdated
    surveyUpdated = SurveyNodeDefs.mergeNodeDefs(nodeDefsUpdated)(survey)
  }

  if (NodeDef.isEntity(nodeDef)) {
    // Update nodeDef descendants cycles
    SurveyNodeDefs.getNodeDefsArray(nodeDef)(surveyUpdated)
      .filter(NodeDef.isDescendantOf(nodeDef))
      .forEach((nodeDefDescendant) => {
        const cyclesOld = NodeDef.getCycles(nodeDefDescendant)
        const cyclesNew = [...cyclesOld, ...cyclesAdded].filter((cycle) => !cyclesDeleted.includes(cycle))
        const nodeDefDescendantUpdate = NodeDef.assocCycles(cyclesNew)(nodeDefDescendant)
        nodeDefsUpdated[nodeDefDescendantUpdate.uuid] = nodeDefDescendantUpdate
      })
  }

  return nodeDefsUpdated
}
