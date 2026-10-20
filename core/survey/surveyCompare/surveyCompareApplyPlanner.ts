import { uuidv4 } from '@core/uuid'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as NodeDefLayoutUpdater from '@core/survey/nodeDefLayoutUpdater'

import {
  SurveyCompareApplicabilityStatus,
  SurveyCompareNodeDefDiff,
  SurveyCompareParams,
  SurveyComparePropGroup,
  SurveyCompareResult,
  SurveyCompareStatus,
  getAllChanges,
} from './surveyCompareTypes'
import { CategoriesApplyPlan, newCategoriesApplyPlan, planCategories } from './surveyCompareApplyPlannerCategories'
import { TaxonomiesApplyPlan, newTaxonomiesApplyPlan, planTaxonomies } from './surveyCompareApplyPlannerTaxonomies'

export interface NodeDefUpdate {
  nodeDefUuid: string
  parentUuid: string
  type?: string
  props: Record<string, any>
  propsAdvanced: Record<string, any>
  /** Meta (hierarchy) to update when the node def (or one of its ancestors) is moved. */
  meta?: { h: string[] }
}

export interface SurveyCompareApplyPlan extends CategoriesApplyPlan, TaxonomiesApplyPlan {
  nodeDefsToInsert: any[]
  nodeDefsToUpdate: NodeDefUpdate[]
  /** Node defs to mark as deleted (their descendants are deleted with them). */
  nodeDefUuidsToDelete: string[]
  appliedIds: string[]
  skippedIds: string[]
}

interface PlanContext extends SurveyCompareParams {
  result: SurveyCompareResult
  usedNodeDefUuids: Set<string>
  targetCycleKeys: string[]
  nodeDefUuidMap: Record<string, string>
  categoryUuidMap: Record<string, string>
  taxonomyUuidMap: Record<string, string>
  /** Parent uuid of every node def of the target survey once the changes are applied (deleted ones excluded). */
  parentUuidByUuid: Record<string, string | null>
  /** Target node defs deleted (descendants of deleted node defs included). */
  deletedUuids: Set<string>
  /** New parent uuid of the moved node defs. */
  newParentUuidByMovedUuid: Record<string, string>
  insertedByUuid: Record<string, any>
}

const isApplicable = (diff: { applicability?: { status: string } }): boolean =>
  Boolean(diff?.applicability) && diff.applicability.status !== SurveyCompareApplicabilityStatus.notApplicable

/**
 * Expands the selected changes with the changes they depend on; not applicable changes are skipped.
 * @param {object} params - The parameters.
 * @param {SurveyCompareResult} params.result - The comparison result.
 * @param {string[]} params.selectedIds - Ids of the selected changes.
 * @returns {{appliedIds: Set<string>, skippedIds: string[]}} - Ids of the changes to apply and of the skipped ones.
 */
export const expandSelection = ({ result, selectedIds }: { result: SurveyCompareResult; selectedIds: string[] }) => {
  const diffsById = Object.fromEntries(getAllChanges(result).map((diff) => [diff.id, diff]))
  const expanded = new Set<string>()
  const stack = [...selectedIds]
  while (stack.length > 0) {
    const id = stack.pop()
    const diff = diffsById[id]
    if (diff && !expanded.has(id)) {
      expanded.add(id)
      stack.push(...diff.dependsOn)
    }
  }
  const appliedIds = [...expanded].filter((id) => isApplicable(diffsById[id]))
  const skippedIds = [...expanded].filter((id) => !isApplicable(diffsById[id]))
  return { appliedIds: new Set(appliedIds), skippedIds }
}

// ===== UUID MAPS

const buildNodeDefUuidMap = ({ context, appliedIds }: { context: PlanContext; appliedIds: Set<string> }) => {
  const { result, usedNodeDefUuids } = context
  for (const diff of result.nodeDefs) {
    if (diff.sourceUuid && diff.targetUuid) {
      context.nodeDefUuidMap[diff.sourceUuid] = diff.targetUuid
    } else if (diff.status === SurveyCompareStatus.added && appliedIds.has(diff.id)) {
      // keep the source uuid, so next comparisons will match node defs by uuid
      context.nodeDefUuidMap[diff.sourceUuid] = usedNodeDefUuids.has(diff.sourceUuid) ? uuidv4() : diff.sourceUuid
    }
  }
}

const buildCategoryAndTaxonomyUuidMaps = ({
  context,
  appliedIds,
}: {
  context: PlanContext
  appliedIds: Set<string>
}) => {
  const { result } = context
  for (const diff of result.categories) {
    if (diff.sourceUuid && (diff.targetUuid || appliedIds.has(diff.id))) {
      context.categoryUuidMap[diff.sourceUuid] = diff.targetUuid ?? diff.sourceUuid
    }
  }
  for (const diff of result.taxonomies) {
    if (diff.sourceUuid && (diff.targetUuid || appliedIds.has(diff.id))) {
      context.taxonomyUuidMap[diff.sourceUuid] = diff.targetUuid ?? diff.sourceUuid
    }
  }
}

const buildUuidMaps = ({ context, appliedIds }: { context: PlanContext; appliedIds: Set<string> }) => {
  buildNodeDefUuidMap({ context, appliedIds })
  buildCategoryAndTaxonomyUuidMaps({ context, appliedIds })
}

// ===== NODE DEFS

const mapRefs = ({ context, props }: { context: PlanContext; props: Record<string, any> }) => {
  const result = { ...props }
  const { categoryUuid, taxonomyUuid, parentCodeDefUuid } = props
  if (categoryUuid) result.categoryUuid = context.categoryUuidMap[categoryUuid] ?? categoryUuid
  if (taxonomyUuid) result.taxonomyUuid = context.taxonomyUuidMap[taxonomyUuid] ?? taxonomyUuid
  if (parentCodeDefUuid) result.parentCodeDefUuid = context.nodeDefUuidMap[parentCodeDefUuid] ?? parentCodeDefUuid
  return result
}

const getTargetNodeDef = (context: PlanContext, uuid: string): any =>
  context.insertedByUuid[uuid] ?? Survey.getNodeDefByUuid(uuid)(context.targetSurvey)

const mapLayoutChildUuid = (context: PlanContext, uuid: string): string | undefined => context.nodeDefUuidMap[uuid]

const getLayoutChildUuid = (child: any): string => (typeof child === 'string' ? child : child?.i)

const nextGridY = (layoutChildren: any[]): number =>
  layoutChildren.reduce((max, child) => Math.max(max, (child.y ?? 0) + (child.h ?? 1)), 0)

// children only in the target survey are kept: added to the layout following the rules of NodeDefLayoutUpdater
const appendMissingChildren = ({ cycle, cycleLayout, children, targetCycleLayout }) => {
  const layoutChildren = [...(cycleLayout[NodeDefLayout.keys.layoutChildren] ?? [])]
  const indexChildren = [...(cycleLayout[NodeDefLayout.keys.indexChildren] ?? [])]
  const present = new Set([...layoutChildren.map(getLayoutChildUuid), ...indexChildren])
  const renderTable = cycleLayout[NodeDefLayout.keys.renderType] === NodeDefLayout.renderType.table
  const targetLayoutChildren = targetCycleLayout?.[NodeDefLayout.keys.layoutChildren] ?? []
  for (const child of children) {
    const uuid = NodeDef.getUuid(child)
    if (present.has(uuid)) continue
    if (renderTable) {
      layoutChildren.push(uuid)
    } else if (NodeDefLayout.hasPage(cycle)(child)) {
      indexChildren.push(uuid)
    } else {
      const previous = targetLayoutChildren.find((layoutChild) => getLayoutChildUuid(layoutChild) === uuid)
      const { w = 1, h = 1 } = typeof previous === 'object' ? previous : {}
      layoutChildren.push({ i: uuid, x: 0, y: nextGridY(layoutChildren), w, h })
    }
  }
  return {
    ...cycleLayout,
    ...(layoutChildren.length > 0 ? { [NodeDefLayout.keys.layoutChildren]: layoutChildren } : {}),
    ...(indexChildren.length > 0 ? { [NodeDefLayout.keys.indexChildren]: indexChildren } : {}),
  }
}

// maps the source layout of a cycle to target uuids; children unknown in the target are dropped, the ones only
// in the target are kept (appended)
const mapCycleLayout = ({ context, cycle, cycleLayout, children, targetCycleLayout }) => {
  if (!cycleLayout) return cycleLayout
  const result = { ...cycleLayout }
  const childUuidsSet = new Set(children.map(NodeDef.getUuid))
  const isKnown = (uuid: string) => Boolean(uuid) && childUuidsSet.has(uuid)
  const layoutChildren = cycleLayout[NodeDefLayout.keys.layoutChildren]
  if (Array.isArray(layoutChildren)) {
    result[NodeDefLayout.keys.layoutChildren] = layoutChildren
      .map((child) =>
        typeof child === 'string'
          ? mapLayoutChildUuid(context, child)
          : { ...child, i: mapLayoutChildUuid(context, child.i) }
      )
      .filter((child) => isKnown(typeof child === 'string' ? child : child.i))
  }
  const indexChildren = cycleLayout[NodeDefLayout.keys.indexChildren]
  if (Array.isArray(indexChildren)) {
    result[NodeDefLayout.keys.indexChildren] = indexChildren
      .map((uuid: string) => mapLayoutChildUuid(context, uuid))
      .filter(isKnown)
  }
  return appendMissingChildren({ cycle, cycleLayout: result, children, targetCycleLayout })
}

// children of a node def once the changes are applied (inserted, moved and deleted node defs considered)
const getTargetChildren = ({ context, targetUuid }: { context: PlanContext; targetUuid: string }) =>
  Object.entries(context.parentUuidByUuid)
    .filter(([, parentUuid]) => parentUuid === targetUuid)
    .map(([uuid]) => getTargetNodeDef(context, uuid))

const buildLayout = ({ context, sourceNodeDef, targetNodeDef, targetUuid, cycles }) => {
  const sourceLayout = NodeDef.getLayout(sourceNodeDef) ?? {}
  const targetLayout = targetNodeDef ? (NodeDef.getLayout(targetNodeDef) ?? {}) : {}
  const children = getTargetChildren({ context, targetUuid })
  const layout = { ...targetLayout }
  for (const cycle of cycles) {
    if (!context.targetCycleKeys.includes(cycle) || !sourceLayout[cycle]) continue
    layout[cycle] = mapCycleLayout({
      context,
      cycle,
      cycleLayout: sourceLayout[cycle],
      children,
      targetCycleLayout: targetLayout[cycle],
    })
  }
  return layout
}

const planNodeDefInsert = ({ context, diff, plan, sourceUuidByInsertedUuid }) => {
  const sourceNodeDef = Survey.getNodeDefByUuid(diff.sourceUuid)(context.sourceSurvey)
  const uuid = context.nodeDefUuidMap[diff.sourceUuid]
  const parentUuid = context.nodeDefUuidMap[NodeDef.getParentUuid(sourceNodeDef)]
  // layout and hierarchy are set later, when all the inserted node defs are known
  const props = { ...NodeDef.getProps(sourceNodeDef) }
  delete props.layout
  const nodeDef = {
    uuid,
    parentUuid,
    type: NodeDef.getType(sourceNodeDef),
    props: mapRefs({ context, props }),
    propsAdvanced: NodeDef.getPropsAdvanced(sourceNodeDef),
    meta: { h: [] },
    analysis: false,
    virtual: false,
  }
  context.insertedByUuid[uuid] = nodeDef
  sourceUuidByInsertedUuid[uuid] = diff.sourceUuid
  plan.nodeDefsToInsert.push(nodeDef)
}

const getRawPropValue = ({ context, sourceNodeDef, group, key }) => {
  if (group === SurveyComparePropGroup.propsAdvanced) {
    return NodeDef.getPropsAdvanced(sourceNodeDef)[key] ?? null
  }
  const props = mapRefs({ context, props: NodeDef.getProps(sourceNodeDef) })
  return props[key] ?? null
}

const newNodeDefUpdate = ({ context, nodeDefUuid }: { context: PlanContext; nodeDefUuid: string }): NodeDefUpdate => ({
  nodeDefUuid,
  parentUuid: context.parentUuidByUuid[nodeDefUuid],
  props: {},
  propsAdvanced: {},
})

const planNodeDefUpdate = ({ context, diff, plan, layoutUpdatedUuids }) => {
  const sourceNodeDef = Survey.getNodeDefByUuid(diff.sourceUuid)(context.sourceSurvey)
  const targetNodeDef = Survey.getNodeDefByUuid(diff.targetUuid)(context.targetSurvey)
  const update = newNodeDefUpdate({ context, nodeDefUuid: diff.targetUuid })
  const layoutCycles = []
  for (const { group, key, cycle } of diff.propDiffs) {
    if (group === SurveyComparePropGroup.structure) {
      // moves are applied through the parent uuid (see buildParentUuidByUuid)
      if (key === 'type') update.type = NodeDef.getType(sourceNodeDef)
    } else if (group === SurveyComparePropGroup.layout) {
      layoutCycles.push(cycle)
    } else if (group === SurveyComparePropGroup.propsAdvanced) {
      update.propsAdvanced[key] = getRawPropValue({ context, sourceNodeDef, group, key })
    } else {
      update.props[key] = getRawPropValue({ context, sourceNodeDef, group, key })
    }
  }
  if (layoutCycles.length > 0) {
    layoutUpdatedUuids.add(diff.targetUuid)
    update.props.layout = buildLayout({
      context,
      sourceNodeDef,
      targetNodeDef,
      targetUuid: diff.targetUuid,
      cycles: layoutCycles,
    })
  }
  if (update.type) {
    // the type is updated together with all the props (props are replaced)
    update.props = {
      ...mapRefs({ context, props: NodeDef.getProps(sourceNodeDef) }),
      layout: update.props.layout ?? NodeDef.getLayout(targetNodeDef),
    }
    update.propsAdvanced = { ...NodeDef.getPropsAdvanced(sourceNodeDef) }
  }
  plan.nodeDefsToUpdate.push(update)
}

// ===== PARENT LAYOUTS (inserted, moved and deleted node defs)

interface ParentLayoutsContext {
  context: PlanContext
  plan: SurveyCompareApplyPlan
  layoutUpdatedUuids: Set<string>
  updatesByUuid: Record<string, NodeDefUpdate>
  survey: any
}

const buildSimulatedSurvey = ({ context, plan }: { context: PlanContext; plan: SurveyCompareApplyPlan }) => {
  let survey = context.targetSurvey
  for (const update of plan.nodeDefsToUpdate) {
    const nodeDef = Survey.getNodeDefByUuid(update.nodeDefUuid)(survey)
    const nodeDefUpdated = { ...nodeDef, props: { ...NodeDef.getProps(nodeDef), ...update.props } }
    survey = Survey.mergeNodeDefs({ [update.nodeDefUuid]: nodeDefUpdated })(survey)
  }
  for (const nodeDef of plan.nodeDefsToInsert) {
    survey = Survey.assocNodeDef({ nodeDef })(survey)
  }
  return survey
}

const setParentLayout = ({ parentsContext, parentUpdated }) => {
  const { context, plan, updatesByUuid } = parentsContext
  const parentUuid = NodeDef.getUuid(parentUpdated)
  parentsContext.survey = Survey.mergeNodeDefs({ [parentUuid]: parentUpdated })(parentsContext.survey)
  const layout = NodeDef.getLayout(parentUpdated)
  const insertedParent = context.insertedByUuid[parentUuid]
  if (insertedParent) {
    insertedParent.props = { ...insertedParent.props, layout }
    return
  }
  let update = updatesByUuid[parentUuid]
  if (!update) {
    update = newNodeDefUpdate({ context, nodeDefUuid: parentUuid })
    updatesByUuid[parentUuid] = update
    plan.nodeDefsToUpdate.push(update)
  }
  update.props = { ...update.props, layout }
}

// parent layouts already built from the source layout (or of deleted parents) are not changed
const canUpdateParentLayout = (parentsContext: ParentLayoutsContext, parentUuid: string): boolean =>
  Boolean(parentUuid) &&
  !parentsContext.layoutUpdatedUuids.has(parentUuid) &&
  !parentsContext.context.deletedUuids.has(parentUuid)

const updateParentLayout = ({ parentsContext, nodeDef, cyclesAdded = [], cyclesDeleted = [] }) => {
  if (!canUpdateParentLayout(parentsContext, NodeDef.getParentUuid(nodeDef))) return
  const parentUpdated = NodeDefLayoutUpdater.updateParentLayout({
    survey: parentsContext.survey,
    nodeDef,
    cyclesAdded,
    cyclesDeleted,
  })
  if (parentUpdated) {
    setParentLayout({ parentsContext, parentUpdated })
  }
}

const getExistingCycles = (context: PlanContext, nodeDef: any): string[] =>
  NodeDef.getCycles(nodeDef).filter((cycle: string) => context.targetCycleKeys.includes(cycle))

const updateParentLayouts = ({ context, plan, layoutUpdatedUuids }) => {
  const parentsContext: ParentLayoutsContext = {
    context,
    plan,
    layoutUpdatedUuids,
    updatesByUuid: Object.fromEntries(plan.nodeDefsToUpdate.map((update) => [update.nodeDefUuid, update])),
    survey: buildSimulatedSurvey({ context, plan }),
  }
  for (const nodeDef of plan.nodeDefsToInsert) {
    updateParentLayout({ parentsContext, nodeDef, cyclesAdded: getExistingCycles(context, nodeDef) })
  }
  for (const [uuid, newParentUuid] of Object.entries(context.newParentUuidByMovedUuid)) {
    const nodeDef = Survey.getNodeDefByUuid(uuid)(parentsContext.survey)
    const cycles = getExistingCycles(context, nodeDef)
    updateParentLayout({ parentsContext, nodeDef, cyclesDeleted: cycles })
    const nodeDefMoved = { ...nodeDef, parentUuid: newParentUuid }
    parentsContext.survey = Survey.mergeNodeDefs({ [uuid]: nodeDefMoved })(parentsContext.survey)
    updateParentLayout({ parentsContext, nodeDef: nodeDefMoved, cyclesAdded: cycles })
  }
  for (const uuid of plan.nodeDefUuidsToDelete) {
    const nodeDef = Survey.getNodeDefByUuid(uuid)(parentsContext.survey)
    updateParentLayout({ parentsContext, nodeDef, cyclesDeleted: getExistingCycles(context, nodeDef) })
  }
}

// ===== HIERARCHY

const computeHierarchy = (context: PlanContext, uuid: string, cache: Record<string, string[]>): string[] => {
  const cached = cache[uuid]
  if (cached) return cached
  const parentUuid = context.parentUuidByUuid[uuid]
  const h = parentUuid ? [...computeHierarchy(context, parentUuid, cache), parentUuid] : []
  cache[uuid] = h
  return h
}

// inserted node defs get their hierarchy; moved node defs (and their descendants) get the updated one
const updateHierarchies = ({ context, plan }: { context: PlanContext; plan: SurveyCompareApplyPlan }) => {
  const cache: Record<string, string[]> = {}
  for (const nodeDef of plan.nodeDefsToInsert) {
    nodeDef.meta = { ...nodeDef.meta, h: computeHierarchy(context, NodeDef.getUuid(nodeDef), cache) }
  }
  if (Object.keys(context.newParentUuidByMovedUuid).length === 0) return
  const updatesByUuid = Object.fromEntries(plan.nodeDefsToUpdate.map((update) => [update.nodeDefUuid, update]))
  for (const uuid of Object.keys(context.parentUuidByUuid)) {
    const nodeDef = Survey.getNodeDefByUuid(uuid)(context.targetSurvey)
    if (!nodeDef || context.insertedByUuid[uuid]) continue
    const h = computeHierarchy(context, uuid, cache)
    if (JSON.stringify(h) === JSON.stringify(NodeDef.getMetaHierarchy(nodeDef))) continue
    let update = updatesByUuid[uuid]
    if (!update) {
      update = newNodeDefUpdate({ context, nodeDefUuid: uuid })
      updatesByUuid[uuid] = update
      plan.nodeDefsToUpdate.push(update)
    }
    update.meta = { h }
  }
}

// ===== FINAL HIERARCHY (moves and deletions)

const planDeletionsAndMoves = ({ context, appliedIds, plan }) => {
  const nodeDefDiffs = context.result.nodeDefs as SurveyCompareNodeDefDiff[]
  const diffsById = Object.fromEntries(nodeDefDiffs.map((diff) => [diff.id, diff]))
  const isAppliedRemoval = (diff: SurveyCompareNodeDefDiff) =>
    diff?.status === SurveyCompareStatus.removed && appliedIds.has(diff.id)
  for (const diff of nodeDefDiffs) {
    if (isAppliedRemoval(diff)) {
      context.deletedUuids.add(diff.targetUuid)
      // descendants are deleted together with their ancestor
      if (!isAppliedRemoval(diffsById[diff.parentId])) plan.nodeDefUuidsToDelete.push(diff.targetUuid)
    } else if (
      diff.status === SurveyCompareStatus.changed &&
      appliedIds.has(diff.id) &&
      diff.propDiffs.some(
        (propDiff) => propDiff.key === 'parent' && propDiff.group === SurveyComparePropGroup.structure
      )
    ) {
      const sourceNodeDef = Survey.getNodeDefByUuid(diff.sourceUuid)(context.sourceSurvey)
      context.newParentUuidByMovedUuid[diff.targetUuid] = context.nodeDefUuidMap[NodeDef.getParentUuid(sourceNodeDef)]
    }
  }
}

const buildParentUuidByUuid = (context: PlanContext) => {
  for (const nodeDef of Survey.getNodeDefsArray(context.targetSurvey)) {
    const uuid = NodeDef.getUuid(nodeDef)
    if (NodeDef.isDeleted(nodeDef) || context.deletedUuids.has(uuid)) continue
    context.parentUuidByUuid[uuid] = context.newParentUuidByMovedUuid[uuid] ?? NodeDef.getParentUuid(nodeDef) ?? null
  }
  for (const nodeDef of Object.values(context.insertedByUuid)) {
    context.parentUuidByUuid[NodeDef.getUuid(nodeDef)] = NodeDef.getParentUuid(nodeDef)
  }
}

const planNodeDefs = ({ context, appliedIds, plan }) => {
  const sourceUuidByInsertedUuid = {}
  const layoutUpdatedUuids = new Set<string>()
  const nodeDefDiffs = context.result.nodeDefs as SurveyCompareNodeDefDiff[]
  planDeletionsAndMoves({ context, appliedIds, plan })
  // diffs are in hierarchical order: parents are inserted before their children
  for (const diff of nodeDefDiffs) {
    if (appliedIds.has(diff.id) && diff.status === SurveyCompareStatus.added) {
      planNodeDefInsert({ context, diff, plan, sourceUuidByInsertedUuid })
    }
  }
  buildParentUuidByUuid(context)
  // inserted node defs get their own layout from the source (children already mapped)
  for (const nodeDef of plan.nodeDefsToInsert) {
    const sourceUuid = sourceUuidByInsertedUuid[NodeDef.getUuid(nodeDef)]
    const sourceNodeDef = Survey.getNodeDefByUuid(sourceUuid)(context.sourceSurvey)
    if (NodeDef.getLayout(sourceNodeDef)) {
      nodeDef.props.layout = buildLayout({
        context,
        sourceNodeDef,
        targetNodeDef: null,
        targetUuid: NodeDef.getUuid(nodeDef),
        cycles: Object.keys(NodeDef.getLayout(sourceNodeDef)),
      })
      layoutUpdatedUuids.add(NodeDef.getUuid(nodeDef))
    }
  }
  for (const diff of nodeDefDiffs) {
    if (appliedIds.has(diff.id) && diff.status === SurveyCompareStatus.changed) {
      planNodeDefUpdate({ context, diff, plan, layoutUpdatedUuids })
    }
  }
  updateParentLayouts({ context, plan, layoutUpdatedUuids })
  updateHierarchies({ context, plan })
}

/**
 * Builds the operations needed to apply the selected changes of a survey comparison to the target survey
 * (categories, taxonomies and node defs; survey info and survey files are planned by buildSurveyInfoApplyPlan).
 * Changes required by the selected ones are applied too; not applicable changes are skipped.
 * @param {object} params - The parameters.
 * @param {SurveyCompareResult} params.result - The comparison result (computed on the same surveys).
 * @param {string[]} params.selectedIds - Ids of the changes to apply.
 * @param {string[]} [params.usedNodeDefUuids] - Node def uuids already used in the target survey (deleted ones included).
 * @returns {SurveyCompareApplyPlan} - The apply plan.
 */
export const buildApplyPlan = ({
  result,
  selectedIds,
  usedNodeDefUuids = [],
  ...params
}: SurveyCompareParams & {
  result: SurveyCompareResult
  selectedIds: string[]
  usedNodeDefUuids?: string[]
}): SurveyCompareApplyPlan => {
  const { appliedIds, skippedIds } = expandSelection({ result, selectedIds })
  const { targetSurvey } = params
  const context: PlanContext = {
    ...params,
    result,
    usedNodeDefUuids: new Set([...usedNodeDefUuids, ...Object.keys(Survey.getNodeDefs(targetSurvey))]),
    targetCycleKeys: Survey.getCycleKeys(Survey.getSurveyInfo(targetSurvey)),
    nodeDefUuidMap: {},
    categoryUuidMap: {},
    taxonomyUuidMap: {},
    parentUuidByUuid: {},
    deletedUuids: new Set(),
    newParentUuidByMovedUuid: {},
    insertedByUuid: {},
  }
  buildUuidMaps({ context, appliedIds })
  const plan: SurveyCompareApplyPlan = {
    ...newCategoriesApplyPlan(),
    ...newTaxonomiesApplyPlan(),
    nodeDefsToInsert: [],
    nodeDefsToUpdate: [],
    nodeDefUuidsToDelete: [],
    appliedIds: [...appliedIds],
    skippedIds,
  }
  planCategories({ params, diffs: result.categories, appliedIds, plan })
  planTaxonomies({ params, diffs: result.taxonomies, appliedIds, plan })
  planNodeDefs({ context, appliedIds, plan })
  return plan
}
