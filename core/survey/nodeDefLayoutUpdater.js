import * as R from 'ramda'

import { uuidv4 } from '@core/uuid'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import * as SurveyNodeDefs from './_survey/surveyNodeDefs'

const _updateParentLayoutChildrenIndex = ({ survey, surveyCycleKey, nodeDef }) => {
  const isEntityInOwnPage = ({ nodeDef: def }) =>
    !NodeDef.isDeleted(def) && NodeDef.isEntity(def) && NodeDefLayout.isDisplayInOwnPage(surveyCycleKey)(def)

  const nodeDefParent = SurveyNodeDefs.getNodeDefParent(nodeDef)(survey)

  const childrenInOwnPage = SurveyNodeDefs.getNodeDefChildren(nodeDefParent)(survey).filter((sibling) =>
    isEntityInOwnPage({ nodeDef: sibling })
  )

  const indexChildren = childrenInOwnPage.map(NodeDef.getUuid)

  return NodeDef.updateLayout((layout) => {
    const layoutUpdated = NodeDefLayout.assocIndexChildren(surveyCycleKey, indexChildren)(layout)
    return layoutUpdated
  })(nodeDefParent)
}

const _onRenderTypeUpdate = ({ survey, surveyCycleKey, nodeDef }) =>
  NodeDef.updateLayout((layout) => {
    let layoutUpdated = null

    if (NodeDefLayout.isRenderTable(surveyCycleKey)(nodeDef)) {
      // render type changed from 'form' to 'table':
      // Assoc layout children
      const nodeDefChildren = SurveyNodeDefs.getNodeDefChildren(nodeDef)(survey)

      layoutUpdated = NodeDefLayout.assocLayoutChildren(surveyCycleKey, nodeDefChildren.map(NodeDef.getUuid))(layout)
    } else {
      // render type changed from 'table' to 'form':
      // dissoc layout children (valid only for table)
      layoutUpdated = NodeDefLayout.dissocLayoutChildren(surveyCycleKey)(layout)

      // Entity rendered as form can only exists in its own page: assign pageUuid
      if (NodeDefLayout.isDisplayInParentPage(surveyCycleKey)(nodeDef)) {
        layoutUpdated = NodeDefLayout.assocPageUuid(surveyCycleKey, uuidv4())(layoutUpdated)
      }
    }
    return layoutUpdated
  })(nodeDef)

export const updateLayoutProp =
  ({ surveyCycleKey, nodeDef, nodeDefPrev = null, key, value }) =>
  (survey) => {
    const renderTypePrev = NodeDefLayout.getRenderType(surveyCycleKey)(nodeDefPrev || nodeDef)

    // throw new Error(
    //   `children ${SurveyNodeDefs.getNodeDefsArray(survey).map(
    //     (child) => `${NodeDef.getName(child)} - ${NodeDefLayout.getPageUuid(surveyCycleKey)(child)}`
    //   )}`
    // )
    let nodeDefUpdated = NodeDef.updateLayout((layout) => {
      const layoutUpdated = NodeDefLayout.assocLayoutProp(surveyCycleKey, key, value)(layout)
      return layoutUpdated
    })(nodeDef)
    const nodeDefsUpdated = { [nodeDef.uuid]: nodeDefUpdated }
    let surveyUpdated = SurveyNodeDefs.mergeNodeDefs(nodeDefsUpdated)(survey)

    if (key === NodeDefLayout.keys.renderType && NodeDef.isEntity(nodeDef) && value !== renderTypePrev) {
      nodeDefUpdated = _onRenderTypeUpdate({
        survey: surveyUpdated,
        surveyCycleKey,
        nodeDef: nodeDefUpdated,
      })
    }
    nodeDefsUpdated[nodeDef.uuid] = nodeDefUpdated

    surveyUpdated = SurveyNodeDefs.mergeNodeDefs(nodeDefsUpdated)(surveyUpdated)

    // update parent layout (children forms index)
    const nodeDefParentUpdated = _updateParentLayoutChildrenIndex({
      survey: surveyUpdated,
      surveyCycleKey,
      nodeDef: nodeDefUpdated,
    })
    nodeDefsUpdated[nodeDefParentUpdated.uuid] = nodeDefParentUpdated

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
  return NodeDef.updateLayout((layout) => {
    const layoutUpdated = NodeDefLayout.assocIndexChildren(cycle, index)(layout)
    return layoutUpdated
  })(nodeDefParent)
}

const _addNodeDefInParentLayoutCycle = ({ survey, cycle, nodeDef }) => {
  const nodeDefParent = SurveyNodeDefs.getNodeDefParent(nodeDef)(survey)

  const layoutForCycle = NodeDefLayout.getLayoutCycle(cycle)(nodeDefParent)

  const nodeDefUuid = NodeDef.getUuid(nodeDef)

  const childPagesIndexPrev = _getOrInitializeChildPagesIndex({ survey, cycle, nodeDefParent })

  const layoutChildrenPrev = NodeDefLayout.getLayoutChildren(cycle)(nodeDefParent)

  if (NodeDefLayout.isRenderTable(cycle)(nodeDefParent)) {
    // Add or node def to children (render as table)
    const layoutChildrenUpdated = R.append(nodeDefUuid)(layoutChildrenPrev)
    return {
      ...layoutForCycle,
      [NodeDefLayout.keys.layoutChildren]: layoutChildrenUpdated,
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
  const y = layoutChildrenPrev.reduce((accY, layoutChild) => R.max(accY, layoutChild.y + layoutChild.h), 0)
  // New node def height depends on its type
  const h = R.propOr(1, NodeDef.getType(nodeDef), nodeDefLayoutHeights)
  const layoutChildrenUpdated = R.append({ i: nodeDefUuid, x: 0, y, w: 1, h })(layoutChildrenPrev)

  return {
    ...layoutForCycle,
    [NodeDefLayout.keys.layoutChildren]: layoutChildrenUpdated,
  }
}

const _removeNodeDefFromParentLayoutCycle = ({ survey, cycle, nodeDef }) => {
  const nodeDefParent = SurveyNodeDefs.getNodeDefParent(nodeDef)(survey)

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
    surveyUpdated = SurveyNodeDefs.assocNodeDef({ nodeDef: nodeDefParentUpdated })
  })

  // update layout of removed cycles
  cyclesDeleted.forEach((cycle) => {
    nodeDefParentUpdated = _updateParentLayoutForCycle({
      survey: surveyUpdated,
      cycle,
      nodeDef,
      updateFn: _removeNodeDefFromParentLayoutCycle,
    })
    surveyUpdated = SurveyNodeDefs.assocNodeDef({ nodeDef: nodeDefParentUpdated })
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
