import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'
import { uuidv4 } from '@core/uuid'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { db } from '@server/db/db'
import * as NodeDefRepository from '../repository/nodeDefRepository'

const nodeDefLayoutHeights = {
  [NodeDef.nodeDefType.coordinate]: 2,
  [NodeDef.nodeDefType.taxon]: 2,
}

const _addCycle = async ({ surveyId, nodeDef, cycle, cyclePrev }, client = db) => {
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

const _updateParentLayoutChildren = ({ nodeDefParent, cycle, updateFn }) => {
  const layoutChildren = NodeDefLayout.getLayoutChildren(cycle)(nodeDefParent)
  const layoutChildrenUpdated = updateFn(layoutChildren)
  const layoutUpdated = R.pipe(
    NodeDefLayout.getLayout,
    NodeDefLayout.assocLayoutChildren(cycle, layoutChildrenUpdated)
  )(nodeDefParent)
  return NodeDefLayout.assocLayout(layoutUpdated)(nodeDefParent)
}

export const updateParentLayout = async ({ surveyId, nodeDef, cyclesAdded = [], cyclesDeleted = [] }, client = db) => {
  if (NodeDef.isRoot(nodeDef) || NodeDef.isVirtual(nodeDef)) return {}

  let nodeDefParent = await NodeDefRepository.fetchNodeDefByUuid(
    surveyId,
    NodeDef.getParentUuid(nodeDef),
    true,
    false,
    client
  )
  const nodeDefUuid = NodeDef.getUuid(nodeDef)

  cyclesAdded.forEach((cycle) => {
    nodeDefParent = _updateParentLayoutChildren({
      nodeDefParent,
      cycle,
      updateFn: (layoutChildren) => {
        if (NodeDefLayout.isRenderTable(cycle)(nodeDefParent)) {
          // Add or node def to children (render as table)
          return R.append(nodeDefUuid)(layoutChildren)
        }
        // Add new node to the bottom left corner of the form (x = 0, y = max value of every child layout y + h or 0)
        const y = R.reduce((accY, layoutChild) => R.max(accY, layoutChild.y + layoutChild.h), 0, layoutChildren)
        // New node def height depends on its type
        const h = R.propOr(1, NodeDef.getType(nodeDef), nodeDefLayoutHeights)
        return R.append({ i: nodeDefUuid, x: 0, y, w: 1, h })(layoutChildren)
      },
    })
  })

  cyclesDeleted.forEach((cycle) => {
    nodeDefParent = _updateParentLayoutChildren({
      nodeDefParent,
      cycle,
      updateFn: (layoutChildren) => {
        if (NodeDefLayout.isRenderTable(cycle)(nodeDefParent)) {
          // Remove node def from children (render as table)
          return R.without([nodeDefUuid])(layoutChildren)
        }
        // Remove node def from children (render as form)
        return R.reject(R.propEq('i', nodeDefUuid), layoutChildren)
      },
    })
  })

  // Update parent node def layout
  const nodeDefParentUuid = NodeDef.getUuid(nodeDefParent)

  return {
    [nodeDefParentUuid]: await NodeDefRepository.updateNodeDefProps(
      surveyId,
      nodeDefParentUuid,
      NodeDef.getParentUuid(nodeDefParent),
      { [NodeDefLayout.keys.layout]: NodeDefLayout.getLayout(nodeDefParent) },
      {},
      client
    ),
  }
}

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
