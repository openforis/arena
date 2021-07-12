import * as R from 'ramda'

import { uuidv4 } from '@core/uuid'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

const nodeDefLayoutHeights = {
  [NodeDef.nodeDefType.coordinate]: 2,
  [NodeDef.nodeDefType.taxon]: 2,
}

/**
 * Adds a cycle to a node def.
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
const _addCycle = async ({ nodeDef, cycle, cyclePrev = null }) => {
  if (cyclePrev) {
    // If cycle prev exists, copy layout from previous cycle
    const layout = NodeDefLayout.getLayout(nodeDef)
    const layoutCyclePrev = NodeDefLayout.getLayoutCycle(cyclePrev)(nodeDef)
    const layoutUpdated = NodeDefLayout.assocLayoutCycle(cycle, layoutCyclePrev)(layout)
    return NodeDefLayout.assocLayout(layoutUpdated)(nodeDef)
  }
  // Otherwise set the default layout
  const layoutUpdated = R.pipe(
    NodeDefLayout.getLayout,
    R.mergeLeft(
      // TODO use NodeDefLayout default props layout
      NodeDef.isEntity(nodeDef)
        ? NodeDefLayout.newLayout(cycle, NodeDefLayout.renderType.form, uuidv4())
        : NodeDefLayout.newLayout(cycle, NodeDefLayout.renderType.checkbox)
    )
  )(nodeDef)
  return NodeDefLayout.assocLayout(layoutUpdated)(nodeDef)
}

const _updateLayoutForCycle = ({ survey, nodeDefParent, nodeDef, cycle, updateFn }) => {
  const layoutCycleUpdated = updateFn({ survey, cycle, nodeDefParent, nodeDef })
  const layoutUpdated = R.pipe(
    NodeDefLayout.getLayout,
    NodeDefLayout.assocLayoutCycle(cycle, layoutCycleUpdated)
  )(nodeDef)
  return NodeDefLayout.assocLayout(layoutUpdated)(nodeDef)
}

const _calculateChildrenFormsIndex = ({ survey, cycle, nodeDefParent }) => {
  const childrenFormsInOwnPage = Survey.getNodeDefChildren(nodeDefParent)(survey).filter(
    (sibling) =>
      !NodeDef.isDeleted(sibling) && NodeDef.isEntity(sibling) && NodeDefLayout.isDisplayInOwnPage(cycle)(sibling)
  )
  return childrenFormsInOwnPage.map(NodeDef.getUuid)
}

const _getOrInitializeChildrenPagesIndex = ({ survey, cycle, nodeDefParent }) => {
  const childrenFormsIndexPrev = NodeDefLayout.getIndexChildren(cycle)(nodeDefParent)
  if (childrenFormsIndexPrev.length > 0) {
    return childrenFormsIndexPrev
  }
  // initialize children forms index, if empty
  return _calculateChildrenFormsIndex({ survey, cycle, nodeDefParent })
}

const _addNodeDefInParentLayoutCycle = ({ survey, cycle, nodeDefParent, nodeDef }) => {
  const layoutForCycle = NodeDefLayout.getLayoutCycle(cycle)(nodeDefParent)

  const nodeDefUuid = NodeDef.getUuid(nodeDef)

  const childrenFormsIndexPrev = _getOrInitializeChildrenPagesIndex({ survey, cycle, nodeDefParent })

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
    const childrenFormsIndexUpdated = [...childrenFormsIndexPrev, nodeDefUuid]
    return { ...layoutForCycle, [NodeDefLayout.keys.indexChildren]: childrenFormsIndexUpdated }
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

  const childrenPaegsIndexPrev = _getOrInitializeChildrenPagesIndex({ survey, cycle, nodeDefParent })

  const layoutChildrenPrev = NodeDefLayout.getLayoutChildren(cycle)(nodeDefParent)

  if (NodeDefLayout.isRenderTable(cycle)(nodeDefParent)) {
    // Remove node def from children (render as table)
    const layoutChildrenUpdated = R.without([nodeDefUuid])(layoutChildrenPrev)
    return { ...layoutForCycle, [NodeDefLayout.keys.layoutChildren]: layoutChildrenUpdated }
  }
  // render as form
  if (NodeDefLayout.hasPage(cycle)(nodeDef)) {
    // Node def displayed in its own page
    const childrenPagesIndexUpdated = R.without([nodeDefUuid])(childrenPaegsIndexPrev)
    return { ...layoutForCycle, [NodeDefLayout.keys.indexChildren]: childrenPagesIndexUpdated }
  }
  // render as form in current page (grid layout)
  // Remove node def from children
  return {
    ...layoutForCycle,
    [NodeDefLayout.keys.layoutChildren]: R.reject(R.propEq('i', nodeDefUuid), layoutChildrenPrev),
  }
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

  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
  let surveyUpdated = { ...survey }

  let nodeDefParentUpdated = nodeDefParent

  // update layout in added cycles
  cyclesAdded.forEach((cycle) => {
    nodeDefParentUpdated = _updateLayoutForCycle({
      survey: surveyUpdated,
      cycle,
      nodeDefParent: nodeDefParentUpdated,
      nodeDef,
      updateFn: _addNodeDefInParentLayoutCycle,
    })
    surveyUpdated = Survey.assocNodeDef({ nodeDef: nodeDefParentUpdated })
  })

  // update layout of removed cycles
  cyclesDeleted.forEach((cycle) => {
    nodeDefParentUpdated = _updateLayoutForCycle({
      survey: surveyUpdated,
      nodeDef: nodeDefParentUpdated,
      cycle,
      updateFn: _removeNodeDefFromParentLayoutCycle,
    })
    surveyUpdated = Survey.assocNodeDef({ nodeDef: nodeDefParentUpdated })
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
export const updateNodeDefLayoutOnCyclesUpdate = ({ survey, nodeDefUuid, cycles }) => {
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

  const cyclesPrev = NodeDef.getCycles(nodeDef)
  const cyclesAdded = R.difference(cycles, cyclesPrev)
  const cyclesDeleted = R.difference(cyclesPrev, cycles)
  const add = !R.isEmpty(cyclesAdded)

  const nodeDefsUpdated = {}

  // Update nodeDef cycles layout
  if (add) {
    const cyclesAddedInfo = cycles
      .map((cycle, i) => ({ cycle, cyclePrev: cycles[i - 1] }))
      .filter((cycleInfo) => R.includes(cycleInfo.cycle, cyclesAdded))

    const nodeDefUpdated = cyclesAddedInfo.reduce(
      (nodeDefUpdatedAcc, cycleInfo) =>
        _addCycle({ nodeDef: nodeDefUpdatedAcc, cycle: cycleInfo.cycle, cyclePrev: cycleInfo.cyclePrev }),
      nodeDef
    )
    nodeDefsUpdated[nodeDef.uuid] = nodeDefUpdated
  } else {
    Survey.getNodeDefsArray(survey).forEach((nodeDefCurrent) => {
      if (cyclesDeleted.some((cycleDeleted) => NodeDefLayout.hasLayoutCycle(cycleDeleted)(nodeDefCurrent))) {
        const layout = NodeDefLayout.getLayout(nodeDefCurrent)
        const layoutUpdated = NodeDefLayout.dissocLayoutCycles(cyclesDeleted)(layout)
        const nodeDefUpdated = NodeDefLayout.assocLayout(layoutUpdated)(nodeDefCurrent)
        nodeDefsUpdated[nodeDefUpdated.uuid] = nodeDefUpdated
      }
    })
  }

  let surveyUpdated = Survey.mergeNodeDefs({ nodeDefs: nodeDefsUpdated })(survey)

  const nodeDefParentUpdated = updateParentLayout({ survey: surveyUpdated, nodeDef, cyclesAdded, cyclesDeleted })
  if (nodeDefParentUpdated) {
    nodeDefsUpdated[nodeDefParentUpdated.uuid] = nodeDefParentUpdated
    surveyUpdated = Survey.mergeNodeDefs({ nodeDefs: nodeDefsUpdated })(survey)
  }

  if (NodeDef.isEntity(nodeDef)) {
    // Update nodeDef descendants cycles
    Survey.getNodeDefsArray(nodeDef)(surveyUpdated)
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
