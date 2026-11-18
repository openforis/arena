import type {
  NodeDef as ArenaNodeDef,
  NodeDefEntityChildPosition,
  NodeDefType,
  Survey as ArenaSurvey,
  NodeDefEntity,
} from '@openforis/arena-core'

import * as A from '@core/arena'

import { uuidv4 } from '@core/uuid'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import * as SurveyNodeDefs from './_survey/surveyNodeDefs'
import { NodeDefLayoutSizes } from './nodeDefLayoutSizes'

type AnyNodeDef = ArenaNodeDef<NodeDefType>
type NodeDefsByUuid = Record<string, AnyNodeDef>
type LayoutCycle = Record<string, any>
// width and height to keep when adding a node def to the parent layout, by cycle
type LayoutInParentByCycle = Record<string, { h?: number; w?: number }>

const _calculateChildPagesIndex = ({
  survey,
  cycle,
  nodeDefParent,
}: {
  survey: ArenaSurvey
  cycle: string
  nodeDefParent: NodeDefEntity
}): string[] => {
  const childEntitiesInOwnPage = SurveyNodeDefs.getNodeDefChildren({ nodeDef: nodeDefParent })(survey).filter(
    (childDef) =>
      !NodeDef.isDeleted(childDef) && NodeDef.isEntity(childDef) && NodeDefLayout.isDisplayInOwnPage(cycle)(childDef)
  )
  const childEntitiesInOwnPageUuids = childEntitiesInOwnPage.map(NodeDef.getUuid)

  // calculate new index starting from the existing one (if any)
  const index = NodeDefLayout.getIndexChildren(cycle)(nodeDefParent)
    // exlclude missing nodeDefs
    .filter((uuid) => childEntitiesInOwnPageUuids.includes(uuid))

  for (const childUuid of childEntitiesInOwnPageUuids) {
    if (!index.includes(childUuid)) {
      index.push(childUuid)
    }
  }
  return index
}

type SurveyCycleNodeDefParams = { survey: ArenaSurvey; surveyCycleKey: string; nodeDef: AnyNodeDef }

const _updateParentLayoutChildrenIndex = ({
  survey,
  surveyCycleKey,
  nodeDef,
}: SurveyCycleNodeDefParams): AnyNodeDef => {
  const nodeDefParent = SurveyNodeDefs.getNodeDefParent(nodeDef)(survey)

  const indexChildren = _calculateChildPagesIndex({ survey, cycle: surveyCycleKey, nodeDefParent })

  return NodeDef.updateLayout((layout) => {
    const layoutUpdated = NodeDefLayout.assocIndexChildren(surveyCycleKey, indexChildren)(layout)
    return layoutUpdated
  })(nodeDefParent)
}

const _onEntityRenderTypeUpdate = ({ survey, surveyCycleKey, nodeDef }: SurveyCycleNodeDefParams): AnyNodeDef =>
  NodeDef.updateLayout((layout) => {
    if (NodeDefLayout.isRenderTable(surveyCycleKey)(nodeDef)) {
      // render type changed from 'form' to 'table':
      // Assoc layout children
      const nodeDefChildren = SurveyNodeDefs.getNodeDefChildren({ nodeDef })(survey)

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

const _removeChildFromLayoutChildren = ({
  surveyCycleKey,
  nodeDef,
  childDefUuid,
}: {
  surveyCycleKey: string
  nodeDef: AnyNodeDef
  childDefUuid: string
}): AnyNodeDef => {
  const layoutChildrenPrev = NodeDefLayout.getLayoutChildrenItems(surveyCycleKey)(nodeDef)
  const layoutChildrenUpdated = layoutChildrenPrev.filter((layoutChildrenItem) => layoutChildrenItem.i !== childDefUuid)
  return NodeDef.updateLayoutProp({
    cycle: surveyCycleKey,
    prop: NodeDefLayout.keys.layoutChildren,
    value: layoutChildrenUpdated,
  })(nodeDef)
}

export const updateLayoutProp =
  ({
    surveyCycleKey,
    nodeDef,
    nodeDefPrev = null,
    key,
    value,
  }: {
    surveyCycleKey: string
    nodeDef: AnyNodeDef
    nodeDefPrev?: AnyNodeDef | null
    key: string
    value: unknown
  }) =>
  (survey: ArenaSurvey): NodeDefsByUuid => {
    const nodeDefUuid = NodeDef.getUuid(nodeDef)
    const renderTypePrev = NodeDefLayout.getRenderType(surveyCycleKey)(nodeDefPrev || nodeDef)

    let nodeDefUpdated = NodeDef.updateLayoutProp({ cycle: surveyCycleKey, prop: key, value })(nodeDef)
    nodeDefUpdated = NodeDef.clearNotApplicableProps(surveyCycleKey)(nodeDefUpdated)

    const nodeDefsUpdated: NodeDefsByUuid = { [nodeDefUuid]: nodeDefUpdated }
    let surveyUpdated = SurveyNodeDefs.mergeNodeDefs(nodeDefsUpdated)(survey)

    if (key === NodeDefLayout.keys.renderType && NodeDef.isEntity(nodeDef) && value !== renderTypePrev) {
      // entity render type changed
      nodeDefUpdated = _onEntityRenderTypeUpdate({ survey: surveyUpdated, surveyCycleKey, nodeDef: nodeDefUpdated })
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

export const updateLayout = ({
  survey,
  nodeDefUuid,
  layout,
  nodeDefPrev = null,
}: {
  survey: ArenaSurvey
  nodeDefUuid: string
  layout: Record<string, LayoutCycle>
  nodeDefPrev?: AnyNodeDef | null
}): NodeDefsByUuid => {
  let surveyUpdated = { ...survey }
  const nodeDefsUpdated: NodeDefsByUuid = {}

  for (const [surveyCycleKey, layoutCycle] of Object.entries(layout)) {
    for (const [key, value] of Object.entries(layoutCycle)) {
      const nodeDef = SurveyNodeDefs.getNodeDefByUuid(nodeDefUuid)(surveyUpdated)
      Object.assign(
        nodeDefsUpdated,
        updateLayoutProp({ surveyCycleKey, nodeDef, nodeDefPrev, key, value })(surveyUpdated)
      )
      surveyUpdated = SurveyNodeDefs.mergeNodeDefs(nodeDefsUpdated)(surveyUpdated)
    }
  }
  return nodeDefsUpdated
}

// adds the layout of a cycle to a node def: copied from the previous cycle (if any) or the default one
const _addLayoutForCycle = ({
  nodeDef,
  cycle,
  cyclePrev = null,
}: {
  nodeDef: AnyNodeDef
  cycle: string
  cyclePrev?: string | null
}): AnyNodeDef =>
  NodeDef.updateLayout((layout) => {
    if (cyclePrev) {
      // If cycle prev exists, copy layout from previous cycle
      const layoutCyclePrev = NodeDefLayout.getLayoutCycle(cyclePrev)(nodeDef)
      const layoutUpdated = NodeDefLayout.assocLayoutCycle(cycle, layoutCyclePrev)(layout)
      return layoutUpdated
    }
    // previous cycle does not exist: set the default layout
    const layoutUpdated = A.mergeLeft(
      NodeDef.isEntity(nodeDef)
        ? NodeDefLayout.newLayout(cycle, NodeDefLayout.renderType.form, uuidv4())
        : NodeDefLayout.newLayout(cycle, NodeDefLayout.renderType.checkbox)
    )(layout)
    return layoutUpdated
  })(nodeDef)

type ParentLayoutCycleParams = { survey: ArenaSurvey; cycle: string; nodeDef: AnyNodeDef }

const _updateParentLayoutForCycle = ({
  survey,
  nodeDef,
  cycle,
  updateFn,
}: ParentLayoutCycleParams & { updateFn: (params: ParentLayoutCycleParams) => LayoutCycle }): NodeDefEntity => {
  const nodeDefParent = SurveyNodeDefs.getNodeDefParent(nodeDef)(survey)
  return NodeDef.updateLayout((layout) => {
    const layoutCycleUpdated = updateFn({ survey, cycle, nodeDef })
    const layoutUpdated = NodeDefLayout.assocLayoutCycle(cycle, layoutCycleUpdated)(layout)
    return layoutUpdated
  })(nodeDefParent) as NodeDefEntity
}

type ParentParams = { survey: ArenaSurvey; cycle: string; nodeDefParent: NodeDefEntity }

const _getOrInitializeChildPagesIndex = ({ survey, cycle, nodeDefParent }: ParentParams): string[] => {
  const childrenFormsIndexPrev = NodeDefLayout.getIndexChildren(cycle)(nodeDefParent)
  if (childrenFormsIndexPrev.length > 0) {
    return childrenFormsIndexPrev
  }
  // initialize children forms index, if empty
  return _calculateChildPagesIndex({ survey, cycle, nodeDefParent })
}

export const initializeParentLayout = ({ survey, cycle, nodeDefParent }: ParentParams): AnyNodeDef => {
  const index = _calculateChildPagesIndex({ survey, cycle, nodeDefParent })
  return NodeDef.updateLayout((layout) => {
    const layoutUpdated = NodeDefLayout.assocIndexChildren(cycle, index)(layout)
    return layoutUpdated
  })(nodeDefParent)
}

const _addNodeDefInParentLayoutCycle = ({
  survey,
  cycle,
  nodeDef,
  h: hParam = null,
  w: wParam = null,
}: ParentLayoutCycleParams & { h?: number | null; w?: number | null }): LayoutCycle => {
  const nodeDefParent = SurveyNodeDefs.getNodeDefParent(nodeDef)(survey)

  const layoutForCycle = NodeDefLayout.getLayoutCycle(cycle)(nodeDefParent)

  const nodeDefUuid = NodeDef.getUuid(nodeDef)

  const layoutChildrenPrev = NodeDefLayout.getLayoutChildren(cycle)(nodeDefParent)

  const layoutForCycleUpdated = { ...layoutForCycle }

  if (NodeDefLayout.isRenderTable(cycle)(nodeDefParent)) {
    // Add or node def to children (render as table)
    layoutForCycleUpdated[NodeDefLayout.keys.layoutChildren] = [...layoutChildrenPrev, nodeDefUuid]
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
  const layoutItemsPrev = layoutChildrenPrev as NodeDefEntityChildPosition[]
  const y = layoutItemsPrev.reduce((accY, layoutChild) => A.max(accY, layoutChild.y + layoutChild.h), 0)

  // New node def height depends on its type
  const minH = NodeDefLayoutSizes.getMinGridItemHeight({ nodeDef })
  const maxH = NodeDefLayoutSizes.getMaxGridItemHeight({ nodeDef })

  const w = wParam ?? 1
  const h = hParam ?? minH
  const layoutChildrenUpdated = [...layoutItemsPrev, { i: nodeDefUuid, x: 0, y, w, h, minH, maxH }]
  layoutForCycleUpdated[NodeDefLayout.keys.layoutChildren] = layoutChildrenUpdated
  return layoutForCycleUpdated
}

const _removeNodeDefFromParentLayoutCycle = ({ survey, cycle, nodeDef }: ParentLayoutCycleParams): LayoutCycle => {
  const nodeDefParent = SurveyNodeDefs.getNodeDefParent(nodeDef)(survey)

  const layoutForCycle = NodeDefLayout.getLayoutCycle(cycle)(nodeDefParent)

  const nodeDefUuid = NodeDef.getUuid(nodeDef)

  const layoutChildrenPrev = NodeDefLayout.getLayoutChildren(cycle)(nodeDefParent)

  if (NodeDefLayout.isRenderTable(cycle)(nodeDefParent)) {
    // Remove node def from children (render as table)
    const layoutChildrenUpdated = A.without([nodeDefUuid])(layoutChildrenPrev)
    return { ...layoutForCycle, [NodeDefLayout.keys.layoutChildren]: layoutChildrenUpdated }
  }
  // render as form

  const childrenPagesIndexPrev = _getOrInitializeChildPagesIndex({ survey, cycle, nodeDefParent })

  if (NodeDefLayout.hasPage(cycle)(nodeDef)) {
    // Node def displayed in its own page
    const childrenPagesIndexUpdated = A.without([nodeDefUuid])(childrenPagesIndexPrev)
    return { ...layoutForCycle, [NodeDefLayout.keys.indexChildren]: childrenPagesIndexUpdated }
  }
  // render as form in current page (grid layout)
  // Remove node def from children
  const layoutForCycleUpdated = {
    ...layoutForCycle,
    [NodeDefLayout.keys.layoutChildren]: A.reject(A.propEq('i', nodeDefUuid), layoutChildrenPrev),
  }
  return layoutForCycleUpdated
}

// updates the parent layout after cycles have been added to or removed from a node def; null if unchanged
export const updateParentLayout = ({
  survey,
  nodeDef,
  cyclesAdded = [],
  cyclesDeleted = [],
  layoutInParentByCycle = null,
}: {
  survey: ArenaSurvey
  nodeDef: AnyNodeDef
  cyclesAdded?: string[]
  cyclesDeleted?: string[]
  layoutInParentByCycle?: LayoutInParentByCycle | null
}): AnyNodeDef | null => {
  if (NodeDef.isRoot(nodeDef) || NodeDef.isVirtual(nodeDef)) {
    return null
  }

  const nodeDefParent = SurveyNodeDefs.getNodeDefParent(nodeDef)(survey)

  let surveyUpdated = { ...survey }
  let nodeDefParentUpdated = { ...nodeDefParent }

  // update layout in added cycles
  for (const cycle of cyclesAdded) {
    nodeDefParentUpdated = _updateParentLayoutForCycle({
      survey: surveyUpdated,
      cycle,
      nodeDef,
      updateFn: ({ survey, cycle, nodeDef }) => {
        const layoutInParentToKeep = layoutInParentByCycle?.[cycle] ?? {}
        const { h, w } = layoutInParentToKeep
        return _addNodeDefInParentLayoutCycle({ survey, cycle, nodeDef, h, w })
      },
    })
    surveyUpdated = SurveyNodeDefs.assocNodeDef(nodeDefParentUpdated)(surveyUpdated)
  }

  // update layout of removed cycles
  for (const cycle of cyclesDeleted) {
    nodeDefParentUpdated = _updateParentLayoutForCycle({
      survey: surveyUpdated,
      cycle,
      nodeDef,
      updateFn: _removeNodeDefFromParentLayoutCycle,
    })
    surveyUpdated = SurveyNodeDefs.assocNodeDef(nodeDefParentUpdated)(surveyUpdated)
  }

  // Update parent node def layout in DB (if changed)
  const nodeDefParentLayout = NodeDef.getLayout(nodeDefParent)
  const nodeDefParentLayoutUpdated = NodeDef.getLayout(nodeDefParentUpdated)

  if (A.equals(nodeDefParentLayout, nodeDefParentLayoutUpdated)) {
    // no changes applied
    return null
  }
  return nodeDefParentUpdated
}

// updates the layout of a node def and its parent after its cycles have been changed
export const updateLayoutOnCyclesUpdate = ({
  survey,
  nodeDefUuid,
  cycles,
  cyclesPrev,
}: {
  survey: ArenaSurvey
  nodeDefUuid: string
  cycles: string[]
  cyclesPrev: string[]
}): NodeDefsByUuid => {
  const nodeDef = SurveyNodeDefs.getNodeDefByUuid(nodeDefUuid)(survey)

  const cyclesAdded: string[] = A.difference(cycles, cyclesPrev)
  const cyclesDeleted: string[] = A.difference(cyclesPrev, cycles)

  const nodeDefsUpdated: NodeDefsByUuid = {}

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

// avoids overlapping form layout items: sets their height to the minimum and moves the items below or above
export const adjustLayoutChildrenHeights = ({
  survey,
  nodeDef,
}: {
  survey: ArenaSurvey
  nodeDef: AnyNodeDef
}): AnyNodeDef => {
  const layout = NodeDefLayout.getLayout(nodeDef)
  const cyclesKeys = Object.keys(layout)
  const layoutUpdated = cyclesKeys.reduce(
    (acc, cycle) => {
      const layoutCycle = NodeDefLayout.getLayoutCycle(cycle)(nodeDef)
      const layoutChildren = NodeDefLayout.getLayoutChildrenSorted(cycle)(nodeDef)

      let prevItem: Pick<NodeDefEntityChildPosition, 'x' | 'y'> = { x: 0, y: 0 }
      let prevRowHeight = 0
      let prevRowMinY = 0

      let currentRowHeightOriginal = 0
      let currentRowHeight = 0
      let currentRowStartingY = 0
      let currentRowYOffset = 0

      const layoutChildrenAdjusted = layoutChildren.reduce((layoutChildrenAcc: NodeDefEntityChildPosition[], item) => {
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
