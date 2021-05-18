import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'
import { uuidv4 } from '@core/uuid'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { db } from '@server/db/db'
import * as NodeDefRepository from '../../repository/nodeDefRepository'

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
 * @param {!number} [params.surveyId] - The survey ID.
 * @param {!object} [params.nodeDef] - The node definition to update.
 * @param {!string} [params.cycle] - The survey cycle to add to the nodeDef.
 * @param {string} [params.cyclePrev=null] - The previous survey cycle (if any).
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<null>} - The result promise.
 * */
const _addCycle = async ({ surveyId, nodeDef, cycle, cyclePrev = null }, client = db) => {
  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  if (cyclePrev) {
    // If cycle prev exists, copy layout from previous cycle
    await NodeDefRepository.copyNodeDefsCyclesLayout(surveyId, nodeDefUuid, cyclePrev, [cycle], client)
  } else {
    // Otherwise set the default layout
    const props = {
      [NodeDefLayout.keys.layout]: R.pipe(
        NodeDefLayout.getLayout,
        R.mergeLeft(
          // TODO use NodeDefLayout default props layout
          NodeDef.isEntity(nodeDef)
            ? NodeDefLayout.newLayout(cycle, NodeDefLayout.renderType.form, uuidv4())
            : NodeDefLayout.newLayout(cycle, NodeDefLayout.renderType.checkbox)
        )
      )(nodeDef),
    }
    await NodeDefRepository.updateNodeDefProps(surveyId, nodeDefUuid, NodeDef.getParentUuid(nodeDef), props, {}, client)
  }
}

/**
 * Updates the layout children prop using the specified update function.
 *
 * @param {!object} params - The update parameters.
 * @param {!object} [params.nodeDef] - The node definition to update.
 * @param {!string} [params.cycle] - The survey cycle to update in the node definition layout.
 * @param {!Function} [params.updateFn] - The update function.
 *
 * @returns {object} - The updated node definition.
 * */
const _updateLayoutChildren = ({ nodeDef, cycle, updateFn }) => {
  const layoutChildren = NodeDefLayout.getLayoutChildren(cycle)(nodeDef)
  const layoutChildrenUpdated = updateFn(layoutChildren)
  const layoutUpdated = R.pipe(
    NodeDefLayout.getLayout,
    NodeDefLayout.assocLayoutChildren(cycle, layoutChildrenUpdated)
  )(nodeDef)
  return NodeDefLayout.assocLayout(layoutUpdated)(nodeDef)
}

/**
 * Updates the parent node definition layout after survey cycles have been added or removed from a node definition.
 *
 * @param {!object} params - The update parameters.
 * @param {!number} [params.surveyId] - The survey ID.
 * @param {!object} [params.nodeDef] - The node definition that has just been updated.
 * @param {Array.<string>} [params.cyclesAdded = []] - The survey cycles added to the nodeDef.
 * @param {Array.<string>} [params.cyclesDeleted = []] - The survey cycles removed from the nodeDef.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<object>} - The updated parent node definition, returned as an object index by UUID.
 * */
export const updateParentLayout = async ({ surveyId, nodeDef, cyclesAdded = [], cyclesDeleted = [] }, client = db) => {
  if (NodeDef.isRoot(nodeDef) || NodeDef.isVirtual(nodeDef)) return {}

  const nodeDefParent = await NodeDefRepository.fetchNodeDefByUuid(
    surveyId,
    NodeDef.getParentUuid(nodeDef),
    true,
    false,
    client
  )
  let nodeDefParentUpdated = nodeDefParent

  const nodeDefUuid = NodeDef.getUuid(nodeDef)

  // update layout in added cycles
  nodeDefParentUpdated = cyclesAdded.reduce(
    (nodeDefParentAcc, cycle) =>
      _updateLayoutChildren({
        nodeDef: nodeDefParentAcc,
        cycle,
        updateFn: (layoutChildren) => {
          if (NodeDefLayout.isRenderTable(cycle)(nodeDefParentAcc)) {
            // Add or node def to children (render as table)
            return R.append(nodeDefUuid)(layoutChildren)
          }
          if (NodeDefLayout.hasPage(cycle)(nodeDef)) {
            // Node def displayed in its own page, node def parent layout must not be changed
            return layoutChildren
          }
          // Add new node to the bottom left corner of the form (x = 0, y = max value of every child layout y + h or 0)
          const y = R.reduce((accY, layoutChild) => R.max(accY, layoutChild.y + layoutChild.h), 0, layoutChildren)
          // New node def height depends on its type
          const h = R.propOr(1, NodeDef.getType(nodeDef), nodeDefLayoutHeights)
          return R.append({ i: nodeDefUuid, x: 0, y, w: 1, h })(layoutChildren)
        },
      }),
    nodeDefParentUpdated
  )

  // update layout of removed cycles
  nodeDefParentUpdated = cyclesDeleted.reduce(
    (nodeDefParentAcc, cycle) =>
      _updateLayoutChildren({
        nodeDef: nodeDefParentAcc,
        cycle,
        updateFn: (layoutChildren) => {
          if (NodeDefLayout.isRenderTable(cycle)(nodeDefParentAcc)) {
            // Remove node def from children (render as table)
            return R.without([nodeDefUuid])(layoutChildren)
          }
          if (NodeDefLayout.hasPage(cycle)(nodeDef)) {
            // Node def displayed in its own page, node def parent layout must not be changed
            return layoutChildren
          }
          // Remove node def from children (render as form)
          return R.reject(R.propEq('i', nodeDefUuid), layoutChildren)
        },
      }),
    nodeDefParentUpdated
  )

  // Update parent node def layout in DB (if changed)
  const nodeDefParentLayout = NodeDefLayout.getLayout(nodeDefParent)
  const nodeDefParentLayoutUpdated = NodeDefLayout.getLayout(nodeDefParentUpdated)

  if (R.equals(nodeDefParentLayout, nodeDefParentLayoutUpdated)) {
    // no changes applied
    return {}
  }
  const nodeDefParentUuid = NodeDef.getUuid(nodeDefParentUpdated)
  return {
    [nodeDefParentUuid]: await NodeDefRepository.updateNodeDefProps(
      surveyId,
      nodeDefParentUuid,
      NodeDef.getParentUuid(nodeDefParentUpdated),
      { [NodeDefLayout.keys.layout]: nodeDefParentLayoutUpdated },
      {},
      client
    ),
  }
}

/**
 * Updates the layout of a node definition and its parent after its survey cycles have been changed.
 * If the node definition is an entity, updates even the cycles of the descendant node definitions.
 *
 * @param {!object} params - The update parameters.
 * @param {!number} [params.surveyId] - The survey ID.
 * @param {!string} [params.nodeDefUuid] - The UUID of the node definition to update.
 * @param {Array.<string>} [params.cycles] - The survey cycles associated to the node definition.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<object>} - The updated parent node definition, returned as an object index by UUID.
 * */
export const updateNodeDefLayoutOnCyclesUpdate = async ({ surveyId, nodeDefUuid, cycles }, client = db) => {
  const nodeDef = await NodeDefRepository.fetchNodeDefByUuid(surveyId, nodeDefUuid, true, false, client)

  const cyclesPrev = NodeDef.getCycles(nodeDef)
  const cyclesAdded = R.difference(cycles, cyclesPrev)
  const cyclesDeleted = R.difference(cyclesPrev, cycles)
  const add = !R.isEmpty(cyclesAdded)

  // Update nodeDef cycles layout
  if (add) {
    const cyclesAddedInfo = cycles
      .map((cycle, i) => ({ cycle, cyclePrev: cycles[i - 1] }))
      .filter((cycleInfo) => R.includes(cycleInfo.cycle, cyclesAdded))

    await Promise.all(
      cyclesAddedInfo.map((cycleInfo) =>
        _addCycle({ surveyId, nodeDef, cycle: cycleInfo.cycle, cyclePrev: cycleInfo.cyclePrev }, client)
      )
    )
  } else {
    await NodeDefRepository.deleteNodeDefsCyclesLayout(surveyId, nodeDefUuid, cyclesDeleted, client)
  }

  let nodeDefsUpdated = await updateParentLayout({ surveyId, nodeDef, cyclesAdded, cyclesDeleted }, client)

  if (NodeDef.isEntity(nodeDef)) {
    // Update nodeDef descendants cycles
    const cyclesUpdate = add ? cyclesAdded : cyclesDeleted
    nodeDefsUpdated = {
      ...nodeDefsUpdated,
      ...ObjectUtils.toUuidIndexedObj(
        await NodeDefRepository.updateNodeDefDescendantsCycles(surveyId, nodeDefUuid, cyclesUpdate, add, client)
      ),
    }
  }

  return nodeDefsUpdated
}
