import * as R from 'ramda'

import { uuidv4 } from '@core/uuid'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import * as SurveyNodeDefs from './_survey/surveyNodeDefs'
import { NodeDefLayoutSizes } from './nodeDefLayoutSizes'

const _calculateChildPagesIndex = ({ survey, cycle, nodeDefParent }) => {
  const childEntitiesInOwnPage = SurveyNodeDefs.getNodeDefChildren(nodeDefParent)(survey).filter(
    (childDef) =>
      !NodeDef.isDeleted(childDef) && NodeDef.isEntity(childDef) && NodeDefLayout.isDisplayInOwnPage(cycle)(childDef)
  )
  const childEntitiesInOwnPageUuids = childEntitiesInOwnPage.map(NodeDef.getUuid)

  // calculate new index starting from the existing one (if any)
  const index = NodeDefLayout.getIndexChildren(cycle)(nodeDefParent)
    // exlclude missing nodeDefs
    .filter((uuid) => childEntitiesInOwnPageUuids.includes(uuid))

  childEntitiesInOwnPageUuids.forEach((childUuid) => {
    if (!index.includes(childUuid)) {
      index.push(childUuid)
    }
  })
  return index
}

const _updateParentLayoutChildrenIndex = ({ survey, surveyCycleKey, nodeDef }) => {
  const nodeDefParent = SurveyNodeDefs.getNodeDefParent(nodeDef)(survey)

  const indexChildren = _calculateChildPagesIndex({ survey, cycle: surveyCycleKey, nodeDefParent })

  return NodeDef.updateLayout((layout) => {
    const layoutUpdated = NodeDefLayout.assocIndexChildren(surveyCycleKey, indexChildren)(layout)
    return layoutUpdated
  })(nodeDefParent)
}

const _onEntityRenderTypeUpdate = ({ survey, surveyCycleKey, nodeDef }) =>
  NodeDef.updateLayout((layout) => {
    if (NodeDefLayout.isRenderTable(surveyCycleKey)(nodeDef)) {
      // render type changed from 'form' to 'table':
      // Assoc layout children
      const nodeDefChildren = SurveyNodeDefs.getNodeDefChildren(nodeDef)(survey)

      return NodeDefLayout.assocLayoutChildren(surveyCycleKey, nodeDefChildren.map(NodeDef.getUuid))(layout)
    }
    // render type changed from 'table' to 'form':
    // dissoc layout children (valid only for table)
    let layoutUpdated = NodeDefLayout.dissocLayoutChildren(surveyCycleKey)(layout)

    // Entity rendered as form can only exists in its own page: assign pageUuid
    if (NodeDefLayout.isDisplayInParentPage(surveyCycleKey)(nodeDef)) {
      layoutUpdated = NodeDefLayout.assocPageUuid(surveyCycleKey, uuidv4())(layoutUpdated)
    }
    return layoutUpdated
  })(nodeDef)

const _removeChildFromLayoutChildren = ({ surveyCycleKey, nodeDef, childDefUuid }) => {
  const layoutChildrenPrev = NodeDefLayout.getLayoutChildren(surveyCycleKey)(nodeDef)
  const layoutChildrenUpdated = layoutChildrenPrev.filter((layoutChildrenItem) => layoutChildrenItem.i !== childDefUuid)
  return NodeDef.updateLayoutProp({
    cycle: surveyCycleKey,
    prop: NodeDefLayout.keys.layoutChildren,
    value: layoutChildrenUpdated,
  })(nodeDef)
}

export const updateLayoutProp =
  ({ surveyCycleKey, nodeDef, nodeDefPrev = null, key, value }) =>
  (survey) => {
    const nodeDefUuid = NodeDef.getUuid(nodeDef)
    const renderTypePrev = NodeDefLayout.getRenderType(surveyCycleKey)(nodeDefPrev || nodeDef)

    let nodeDefUpdated = NodeDef.updateLayoutProp({ cycle: surveyCycleKey, prop: key, value })(nodeDef)
    nodeDefUpdated = NodeDef.clearNotApplicableProps(surveyCycleKey)(nodeDefUpdated)

    const nodeDefsUpdated = { [nodeDefUuid]: nodeDefUpdated }
    let surveyUpdated = SurveyNodeDefs.mergeNodeDefs(nodeDefsUpdated)(survey)

    if (key === NodeDefLayout.keys.renderType && NodeDef.isEntity(nodeDef) && value !== renderTypePrev) {
      // entity render type changed
      nodeDefUpdated = _onEntityRenderTypeUpdate({
        survey: surveyUpdated,
        surveyCycleKey,
        nodeDef: nodeDefUpdated,
      })
    }
    nodeDefsUpdated[nodeDefUuid] = nodeDefUpdated

    if (!NodeDef.isRoot(nodeDef)) {
      surveyUpdated = SurveyNodeDefs.mergeNodeDefs(nodeDefsUpdated)(surveyUpdated)
      // update parent layout (children forms index)
      let nodeDefParentUpdated = _updateParentLayoutChildrenIndex({
        survey: surveyUpdated,
        surveyCycleKey,
        nodeDef: nodeDefUpdated,
      })
      if (key === NodeDefLayout.keys.pageUuid && value) {
        nodeDefParentUpdated = _removeChildFromLayoutChildren({
          surveyCycleKey,
          nodeDef: nodeDefParentUpdated,
          childDefUuid: nodeDefUuid,
        })
      }
      nodeDefsUpdated[nodeDefParentUpdated.uuid] = nodeDefParentUpdated
    }
    return nodeDefsUpdated
  }

export const updateLayout = ({ survey, nodeDefUuid, layout, nodeDefPrev = null }) => {
  let surveyUpdated = { ...survey }
  const nodeDefsUpdated = {}
  const layoutEntries = Object.entries(layout)

  layoutEntries.forEach(([surveyCycleKey, layoutCycle]) => {
    Object.entries(layoutCycle).forEach(([key, value]) => {
      const nodeDef = SurveyNodeDefs.getNodeDefByUuid(nodeDefUuid)(surveyUpdated)
      Object.assign(
        nodeDefsUpdated,
        updateLayoutProp({ surveyCycleKey, nodeDef, nodeDefPrev, key, value })(surveyUpdated)
      )
      surveyUpdated = SurveyNodeDefs.mergeNodeDefs(nodeDefsUpdated)(surveyUpdated)
    })
  })
  return nodeDefsUpdated
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
const _addLayoutForCycle = ({ nodeDef, cycle, cyclePrev = null }) =>
  NodeDef.updateLayout((layout) => {
    if (cyclePrev) {
      // If cycle prev exists, copy layout from previous cycle
      const layoutCyclePrev = NodeDefLayout.getLayoutCycle(cyclePrev)(nodeDef)
      const layoutUpdated = NodeDefLayout.assocLayoutCycle(cycle, layoutCyclePrev)(layout)
      return layoutUpdated
    }
    // previous cycle does not exist: set the default layout
    const layoutUpdated = R.mergeLeft(
      // TODO use NodeDefLayout default props layout
      NodeDef.isEntity(nodeDef)
        ? NodeDefLayout.newLayout(cycle, NodeDefLayout.renderType.form, uuidv4())
        : NodeDefLayout.newLayout(cycle, NodeDefLayout.renderType.checkbox)
    )(layout)
    return layoutUpdated
  })(nodeDef)

const _updateParentLayoutForCycle = ({ survey, nodeDef, cycle, updateFn }) => {
  const nodeDefParent = SurveyNodeDefs.getNodeDefParent(nodeDef)(survey)
  return NodeDef.updateLayout((layout) => {
    const layoutCycleUpdated = updateFn({ survey, cycle, nodeDef })
    const layoutUpdated = NodeDefLayout.assocLayoutCycle(cycle, layoutCycleUpdated)(layout)
    return layoutUpdated
  })(nodeDefParent)
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
  return NodeDef.updateLayout((layout) => {
    const layoutUpdated = NodeDefLayout.assocIndexChildren(cycle, index)(layout)
    return layoutUpdated
  })(nodeDefParent)
}

const _addNodeDefInParentLayoutCycle = ({ survey, cycle, nodeDef }) => {
  const nodeDefParent = SurveyNodeDefs.getNodeDefParent(nodeDef)(survey)

  const layoutForCycle = NodeDefLayout.getLayoutCycle(cycle)(nodeDefParent)

  const nodeDefUuid = NodeDef.getUuid(nodeDef)

  const layoutChildrenPrev = NodeDefLayout.getLayoutChildren(cycle)(nodeDefParent)

  const layoutForCycleUpdated = Object.assign({}, layoutForCycle)

  if (NodeDefLayout.isRenderTable(cycle)(nodeDefParent)) {
    // Add or node def to children (render as table)
    layoutForCycleUpdated[NodeDefLayout.keys.layoutChildren] = layoutChildrenPrev.concat(nodeDefUuid)
    return layoutForCycleUpdated
  }

  // render as form
  if (NodeDefLayout.hasPage(cycle)(nodeDef)) {
    // Node def displayed in its own page
    const childPagesIndexPrev = _getOrInitializeChildPagesIndex({ survey, cycle, nodeDefParent })
    layoutForCycleUpdated[NodeDefLayout.keys.indexChildren] = childPagesIndexPrev.concat(nodeDefUuid)
    return layoutForCycleUpdated
  }
  // render as form in current page (grid layout)
  // Add new node to the bottom left corner of the form (x = 0, y = max value of every child layout y + h or 0)
  const y = layoutChildrenPrev.reduce((accY, layoutChild) => R.max(accY, layoutChild.y + layoutChild.h), 0)

  // New node def height depends on its type
  const minH = NodeDefLayoutSizes.getMinGridItemHeight({ nodeDef })
  const maxH = NodeDefLayoutSizes.getMaxGridItemHeight({ nodeDef })

  const layoutChildrenUpdated = layoutChildrenPrev.concat({ i: nodeDefUuid, x: 0, y, w: 1, h: minH, minH, maxH })
  layoutForCycleUpdated[NodeDefLayout.keys.layoutChildren] = layoutChildrenUpdated
  return layoutForCycleUpdated
}

const _removeNodeDefFromParentLayoutCycle = ({ survey, cycle, nodeDef }) => {
  const nodeDefParent = SurveyNodeDefs.getNodeDefParent(nodeDef)(survey)

  const layoutForCycle = NodeDefLayout.getLayoutCycle(cycle)(nodeDefParent)

  const nodeDefUuid = NodeDef.getUuid(nodeDef)

  const layoutChildrenPrev = NodeDefLayout.getLayoutChildren(cycle)(nodeDefParent)

  if (NodeDefLayout.isRenderTable(cycle)(nodeDefParent)) {
    // Remove node def from children (render as table)
    const layoutChildrenUpdated = R.without([nodeDefUuid])(layoutChildrenPrev)
    return Object.assign({}, layoutForCycle, { [NodeDefLayout.keys.layoutChildren]: layoutChildrenUpdated })
  }
  // render as form

  const childrenPagesIndexPrev = _getOrInitializeChildPagesIndex({ survey, cycle, nodeDefParent })

  if (NodeDefLayout.hasPage(cycle)(nodeDef)) {
    // Node def displayed in its own page
    const childrenPagesIndexUpdated = R.without([nodeDefUuid])(childrenPagesIndexPrev)
    return Object.assign({}, layoutForCycle, { [NodeDefLayout.keys.indexChildren]: childrenPagesIndexUpdated })
  }
  // render as form in current page (grid layout)
  // Remove node def from children
  const layoutForCycleUpdated = Object.assign({}, layoutForCycle, {
    [NodeDefLayout.keys.layoutChildren]: R.reject(R.propEq('i', nodeDefUuid), layoutChildrenPrev),
  })
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
 * @returns {object} - The updated parent node definition, if changed.
 * */
export const updateParentLayout = ({ survey, nodeDef, cyclesAdded = [], cyclesDeleted = [] }) => {
  if (NodeDef.isRoot(nodeDef) || NodeDef.isVirtual(nodeDef)) {
    return null
  }

  const nodeDefParent = SurveyNodeDefs.getNodeDefParent(nodeDef)(survey)

  let surveyUpdated = { ...survey }
  let nodeDefParentUpdated = { ...nodeDefParent }

  // update layout in added cycles
  cyclesAdded.forEach((cycle) => {
    nodeDefParentUpdated = _updateParentLayoutForCycle({
      survey: surveyUpdated,
      cycle,
      nodeDef,
      updateFn: _addNodeDefInParentLayoutCycle,
    })
    surveyUpdated = SurveyNodeDefs.assocNodeDef(nodeDefParentUpdated)(surveyUpdated)
  })

  // update layout of removed cycles
  cyclesDeleted.forEach((cycle) => {
    nodeDefParentUpdated = _updateParentLayoutForCycle({
      survey: surveyUpdated,
      cycle,
      nodeDef,
      updateFn: _removeNodeDefFromParentLayoutCycle,
    })
    surveyUpdated = SurveyNodeDefs.assocNodeDef(nodeDefParentUpdated)(surveyUpdated)
  })

  // Update parent node def layout in DB (if changed)
  const nodeDefParentLayout = NodeDef.getLayout(nodeDefParent)
  const nodeDefParentLayoutUpdated = NodeDef.getLayout(nodeDefParentUpdated)

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
export const updateLayoutOnCyclesUpdate = ({ survey, nodeDefUuid, cycles, cyclesPrev }) => {
  const nodeDef = SurveyNodeDefs.getNodeDefByUuid(nodeDefUuid)(survey)

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
    nodeDefsUpdated[nodeDefUuid] = nodeDefUpdated
  }
  // remove layout for deleted cycles
  if (cyclesDeleted.some((cycleDeleted) => NodeDefLayout.hasLayoutCycle(cycleDeleted)(nodeDef))) {
    const nodeDefUpdated = NodeDef.updateLayout((layout) => {
      const layoutUpdated = NodeDefLayout.dissocLayoutCycles(cyclesDeleted)(layout)
      return layoutUpdated
    })(nodeDef)
    nodeDefsUpdated[nodeDefUuid] = nodeDefUpdated
  }

  const surveyUpdated = SurveyNodeDefs.mergeNodeDefs(nodeDefsUpdated)(survey)

  // update parent layout
  const nodeDefParentUpdated = updateParentLayout({ survey: surveyUpdated, nodeDef, cyclesAdded, cyclesDeleted })
  if (nodeDefParentUpdated) {
    nodeDefsUpdated[nodeDefParentUpdated.uuid] = nodeDefParentUpdated
  }

  return nodeDefsUpdated
}

/**
 * Avoids that items in form layout overlap each other by setting their height to the minimum
 * and moving the items below or above if necessary.
 *
 * @param {!object} params - The function parameters.
 * @param {!object} [params.survey] - The survey.
 * @param {!object} [params.nodeDef] - The node defintion.
 * @returns {object} - The updated node defintion.
 */
export const adjustLayoutChildrenHeights = ({ survey, nodeDef }) => {
  const layout = NodeDefLayout.getLayout(nodeDef)
  const cyclesKeys = Object.keys(layout)
  const layoutUpdated = cyclesKeys.reduce(
    (acc, cycle) => {
      const layoutCycle = NodeDefLayout.getLayoutCycle(cycle)(nodeDef)
      const layoutChildren = NodeDefLayout.getLayoutChildrenSorted(cycle)(nodeDef)

      let prevItem = { x: 0, y: 0, w: 0, h: 0, yOriginal: 0 }
      let prevRowHeight = 0
      let prevRowMinY = 0

      let currentRowHeightOriginal = 0
      let currentRowHeight = 0
      let currentRowStartingY = 0
      let currentRowYOffset = 0

      const layoutChildrenAdjusted = layoutChildren.reduce((layoutChildrenAcc, item) => {
        const { i: itemNodeDefUuid, h: hOriginal, w, x, y: yOriginal } = item
        const itemNodeDef = SurveyNodeDefs.getNodeDefByUuid(itemNodeDefUuid)(survey)

        const sameRowOfPreviousItem = x > prevItem.x

        if (!sameRowOfPreviousItem) {
          prevRowHeight = currentRowHeight
          prevRowMinY = currentRowStartingY

          const rowHeightDiff = currentRowHeightOriginal - currentRowHeight
          if (rowHeightDiff > 0) {
            // prev row has been shrinked
            currentRowYOffset = currentRowYOffset + rowHeightDiff
          }
          currentRowHeightOriginal = 0
          currentRowHeight = 0
          currentRowStartingY = Math.max(yOriginal, prevRowMinY + prevRowHeight)
        }

        const hMin = NodeDefLayoutSizes.getMinGridItemHeight({ nodeDef: itemNodeDef })
        const hMax = NodeDefLayoutSizes.getMaxGridItemHeight({ nodeDef: itemNodeDef })
        let h = hOriginal
        if (h < hMin) h = hMin
        if (hMax && h > hMax) h = hMax

        const y =
          (sameRowOfPreviousItem
            ? // item can have the same y of the previous one
              Math.max(yOriginal, prevItem.y)
            : // item in another row
              Math.max(yOriginal, prevRowMinY + prevRowHeight)) - currentRowYOffset

        currentRowHeightOriginal = Math.max(currentRowHeightOriginal, y + hOriginal - currentRowStartingY)
        currentRowHeight = Math.max(currentRowHeight, y + h - currentRowStartingY)
        currentRowStartingY = Math.min(currentRowStartingY, y)

        const itemUpdated = { ...item, h, w, x, y }
        prevItem = itemUpdated

        layoutChildrenAcc.push(itemUpdated)
        return layoutChildrenAcc
      }, [])
      acc[cycle] = { ...layoutCycle, [NodeDefLayout.keys.layoutChildren]: layoutChildrenAdjusted }
      return acc
    },
    { ...layout }
  )
  return NodeDef.assocLayout(layoutUpdated)(nodeDef)
}
