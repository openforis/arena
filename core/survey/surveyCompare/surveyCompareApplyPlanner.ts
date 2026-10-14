import { uuidv4 } from '@core/uuid'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as NodeDefLayoutUpdater from '@core/survey/nodeDefLayoutUpdater'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'

import {
  SurveyCompareApplicabilityStatus,
  SurveyCompareCategoryDiff,
  SurveyCompareNodeDefDiff,
  SurveyCompareParams,
  SurveyComparePropGroup,
  SurveyCompareResult,
  SurveyCompareStatus,
} from './surveyCompareTypes'
import { indexItemsByCodePath, updatableCategoryProps } from './surveyCompareCategories'

export interface NodeDefUpdate {
  nodeDefUuid: string
  parentUuid: string
  type?: string
  props: Record<string, any>
  propsAdvanced: Record<string, any>
}

export interface SurveyCompareApplyPlan {
  categoriesToInsert: { category: any; items: any[] }[]
  categoryPropsToUpdate: { categoryUuid: string; key: string; value: any }[]
  categoryItemsToInsert: { categoryUuid: string; items: any[] }[]
  categoryItemsToUpdate: { categoryUuid: string; items: any[] }[]
  nodeDefsToInsert: any[]
  nodeDefsToUpdate: NodeDefUpdate[]
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
}

const isApplicable = (diff: { applicability?: { status: string } }): boolean =>
  Boolean(diff.applicability) && diff.applicability.status !== SurveyCompareApplicabilityStatus.notApplicable

const expandSelection = ({ result, selectedIds }: { result: SurveyCompareResult; selectedIds: string[] }) => {
  const diffsById = Object.fromEntries(
    [...result.nodeDefs, ...result.categories, ...result.taxonomies].map((diff) => [diff.id, diff])
  )
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

const buildUuidMaps = ({ context, appliedIds }: { context: PlanContext; appliedIds: Set<string> }) => {
  const { result, usedNodeDefUuids } = context
  for (const diff of result.nodeDefs) {
    if (diff.sourceUuid && diff.targetUuid) {
      context.nodeDefUuidMap[diff.sourceUuid] = diff.targetUuid
    } else if (diff.status === SurveyCompareStatus.added && appliedIds.has(diff.id)) {
      // keep the source uuid, so next comparisons will match node defs by uuid
      context.nodeDefUuidMap[diff.sourceUuid] = usedNodeDefUuids.has(diff.sourceUuid) ? uuidv4() : diff.sourceUuid
    }
  }
  for (const diff of result.categories) {
    if (diff.sourceUuid && (diff.targetUuid || appliedIds.has(diff.id))) {
      context.categoryUuidMap[diff.sourceUuid] = diff.targetUuid ?? diff.sourceUuid
    }
  }
  for (const diff of result.taxonomies) {
    if (diff.sourceUuid && diff.targetUuid) {
      context.taxonomyUuidMap[diff.sourceUuid] = diff.targetUuid
    }
  }
}

// ===== CATEGORIES

const planCategoryInsert = ({ context, diff, plan }) => {
  const category = Survey.getCategoryByUuid(diff.sourceUuid)(context.sourceSurvey)
  const categoryUuid = Category.getUuid(category)
  const levels = Category.getLevelsArray(category).map(CategoryLevel.assocCategoryUuid(categoryUuid))
  plan.categoriesToInsert.push({
    category: Category.assocLevelsArray(levels)(category),
    items: context.sourceItemsByCategoryUuid[categoryUuid] ?? [],
  })
}

const sortByCodePathLength = <T extends { codePath: string[] }>(entries: T[]): T[] =>
  [...entries].sort((entryA, entryB) => entryA.codePath.length - entryB.codePath.length)

const planCategoryItemsChanges = ({
  context,
  diff,
  plan,
  targetCategory,
}: {
  context: PlanContext
  diff: SurveyCompareCategoryDiff
  plan: SurveyCompareApplyPlan
  targetCategory: any
}) => {
  const targetItems = context.targetItemsByCategoryUuid[diff.targetUuid] ?? []
  const sourceIndex = indexItemsByCodePath(context.sourceItemsByCategoryUuid[diff.sourceUuid])
  const targetIndex = indexItemsByCodePath(targetItems)
  const targetItemUuids = new Set(targetItems.map(CategoryItem.getUuid))
  const targetLevels = Category.getLevelsArray(targetCategory)
  const itemUuidByCodePathKey = Object.fromEntries(
    Object.entries(targetIndex).map(([key, { item }]) => [key, CategoryItem.getUuid(item)])
  )
  const itemsToInsert = []
  const itemsToUpdate = []
  for (const { codePath, status } of sortByCodePathLength(diff.items)) {
    const key = JSON.stringify(codePath)
    const sourceItem = sourceIndex[key]?.item
    if (status === SurveyCompareStatus.added) {
      const sourceItemUuid = CategoryItem.getUuid(sourceItem)
      const uuid = targetItemUuids.has(sourceItemUuid) ? uuidv4() : sourceItemUuid
      const parentKey = codePath.length > 1 ? JSON.stringify(codePath.slice(0, -1)) : null
      itemUuidByCodePathKey[key] = uuid
      itemsToInsert.push({
        ...sourceItem,
        uuid,
        levelUuid: CategoryLevel.getUuid(targetLevels[codePath.length - 1]),
        parentUuid: parentKey ? itemUuidByCodePathKey[parentKey] : null,
      })
    } else if (status === SurveyCompareStatus.changed) {
      const targetItem = targetIndex[key].item
      itemsToUpdate.push({
        ...targetItem,
        props: { ...CategoryItem.getProps(sourceItem), index: CategoryItem.getIndex(targetItem) },
      })
    }
  }
  const categoryUuid = Category.getUuid(targetCategory)
  if (itemsToInsert.length > 0) plan.categoryItemsToInsert.push({ categoryUuid, items: itemsToInsert })
  if (itemsToUpdate.length > 0) plan.categoryItemsToUpdate.push({ categoryUuid, items: itemsToUpdate })
}

const planCategoryUpdate = ({ context, diff, plan }) => {
  const sourceCategory = Survey.getCategoryByUuid(diff.sourceUuid)(context.sourceSurvey)
  const targetCategory = Survey.getCategoryByUuid(diff.targetUuid)(context.targetSurvey)
  for (const { key } of diff.propDiffs) {
    if (updatableCategoryProps.includes(key)) {
      plan.categoryPropsToUpdate.push({
        categoryUuid: diff.targetUuid,
        key,
        value: Category.getProps(sourceCategory)[key] ?? null,
      })
    }
  }
  planCategoryItemsChanges({ context, diff, plan, targetCategory })
}

const planCategories = ({ context, appliedIds, plan }) => {
  for (const diff of context.result.categories as SurveyCompareCategoryDiff[]) {
    if (!appliedIds.has(diff.id)) continue
    if (diff.status === SurveyCompareStatus.added) {
      planCategoryInsert({ context, diff, plan })
    } else if (diff.status === SurveyCompareStatus.changed) {
      planCategoryUpdate({ context, diff, plan })
    }
  }
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

const getTargetChildren = ({ context, targetUuid, insertedNodeDefs }) => {
  const existing = Survey.getNodeDefsArray(context.targetSurvey).filter(
    (nodeDef) => NodeDef.getParentUuid(nodeDef) === targetUuid && !NodeDef.isDeleted(nodeDef)
  )
  const inserted = insertedNodeDefs.filter((nodeDef) => NodeDef.getParentUuid(nodeDef) === targetUuid)
  return [...existing, ...inserted]
}

const buildLayout = ({ context, sourceNodeDef, targetNodeDef, targetUuid, cycles, insertedNodeDefs }) => {
  const sourceLayout = NodeDef.getLayout(sourceNodeDef) ?? {}
  const targetLayout = targetNodeDef ? (NodeDef.getLayout(targetNodeDef) ?? {}) : {}
  const children = getTargetChildren({ context, targetUuid, insertedNodeDefs })
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

const planNodeDefInsert = ({ context, diff, plan, insertedByUuid, sourceUuidByInsertedUuid }) => {
  const sourceNodeDef = Survey.getNodeDefByUuid(diff.sourceUuid)(context.sourceSurvey)
  const uuid = context.nodeDefUuidMap[diff.sourceUuid]
  const parentUuid = context.nodeDefUuidMap[NodeDef.getParentUuid(sourceNodeDef)]
  const parent = insertedByUuid[parentUuid] ?? Survey.getNodeDefByUuid(parentUuid)(context.targetSurvey)
  // layout is set later, when all the inserted node defs are known
  const props = { ...NodeDef.getProps(sourceNodeDef) }
  delete props.layout
  const nodeDef = {
    uuid,
    parentUuid,
    type: NodeDef.getType(sourceNodeDef),
    props: mapRefs({ context, props }),
    propsAdvanced: NodeDef.getPropsAdvanced(sourceNodeDef),
    meta: { h: [...NodeDef.getMetaHierarchy(parent), parentUuid] },
    analysis: false,
    virtual: false,
  }
  insertedByUuid[uuid] = nodeDef
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

const planNodeDefUpdate = ({ context, diff, plan, layoutUpdatedUuids }) => {
  const sourceNodeDef = Survey.getNodeDefByUuid(diff.sourceUuid)(context.sourceSurvey)
  const targetNodeDef = Survey.getNodeDefByUuid(diff.targetUuid)(context.targetSurvey)
  const update: NodeDefUpdate = {
    nodeDefUuid: diff.targetUuid,
    parentUuid: NodeDef.getParentUuid(targetNodeDef),
    props: {},
    propsAdvanced: {},
  }
  const layoutCycles = []
  for (const { group, key, cycle } of diff.propDiffs) {
    if (group === SurveyComparePropGroup.structure) {
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
      insertedNodeDefs: plan.nodeDefsToInsert,
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

// inserted node defs need to be added to the layout of their parent, when not already done by a source layout
const addInsertedNodeDefsToParentLayout = ({ context, plan, layoutUpdatedUuids }) => {
  let survey = context.targetSurvey
  const updatesByUuid: Record<string, NodeDefUpdate> = Object.fromEntries(
    plan.nodeDefsToUpdate.map((update) => [update.nodeDefUuid, update])
  )
  for (const update of plan.nodeDefsToUpdate) {
    const nodeDef = Survey.getNodeDefByUuid(update.nodeDefUuid)(survey)
    const nodeDefUpdated = { ...nodeDef, props: { ...NodeDef.getProps(nodeDef), ...update.props } }
    survey = Survey.mergeNodeDefs({ [update.nodeDefUuid]: nodeDefUpdated })(survey)
  }
  for (const nodeDef of plan.nodeDefsToInsert) {
    survey = Survey.assocNodeDef({ nodeDef })(survey)
  }
  for (const nodeDef of plan.nodeDefsToInsert) {
    const parentUuid = NodeDef.getParentUuid(nodeDef)
    if (layoutUpdatedUuids.has(parentUuid)) continue
    const cyclesAdded = NodeDef.getCycles(nodeDef).filter((cycle: string) => context.targetCycleKeys.includes(cycle))
    const parentUpdated = NodeDefLayoutUpdater.updateParentLayout({ survey, nodeDef, cyclesAdded })
    if (!parentUpdated) continue
    survey = Survey.mergeNodeDefs({ [parentUuid]: parentUpdated })(survey)
    const insertedParent = plan.nodeDefsToInsert.find((inserted) => NodeDef.getUuid(inserted) === parentUuid)
    if (insertedParent) {
      insertedParent.props = { ...insertedParent.props, layout: NodeDef.getLayout(parentUpdated) }
    } else {
      const update = updatesByUuid[parentUuid] ?? {
        nodeDefUuid: parentUuid,
        parentUuid: NodeDef.getParentUuid(parentUpdated),
        props: {},
        propsAdvanced: {},
      }
      update.props = { ...update.props, layout: NodeDef.getLayout(parentUpdated) }
      if (!updatesByUuid[parentUuid]) {
        updatesByUuid[parentUuid] = update
        plan.nodeDefsToUpdate.push(update)
      }
    }
  }
}

const planNodeDefs = ({ context, appliedIds, plan }) => {
  const insertedByUuid = {}
  const sourceUuidByInsertedUuid = {}
  const layoutUpdatedUuids = new Set<string>()
  const nodeDefDiffs = context.result.nodeDefs as SurveyCompareNodeDefDiff[]
  // diffs are in hierarchical order: parents are inserted before their children
  for (const diff of nodeDefDiffs) {
    if (appliedIds.has(diff.id) && diff.status === SurveyCompareStatus.added) {
      planNodeDefInsert({ context, diff, plan, insertedByUuid, sourceUuidByInsertedUuid })
    }
  }
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
        insertedNodeDefs: plan.nodeDefsToInsert,
      })
      layoutUpdatedUuids.add(NodeDef.getUuid(nodeDef))
    }
  }
  for (const diff of nodeDefDiffs) {
    if (appliedIds.has(diff.id) && diff.status === SurveyCompareStatus.changed) {
      planNodeDefUpdate({ context, diff, plan, layoutUpdatedUuids })
    }
  }
  addInsertedNodeDefsToParentLayout({ context, plan, layoutUpdatedUuids })
}

/**
 * Builds the operations needed to apply the selected changes of a survey comparison to the target survey.
 * Changes required by the selected ones are applied too; not applicable changes are skipped.
 * @param {object} params - The parameters.
 * @param {SurveyCompareResult} params.result - The comparison result (computed on the same surveys).
 * @param {string[]} params.selectedIds - Ids of the changes to apply.
 * @param {string[]} [params.usedNodeDefUuids] - Node def uuids already used in the target survey (deleted ones included).
 * @returns {SurveyCompareApplyPlan} - The apply plan.
 */
export const buildApplyPlan = ({
  sourceSurvey,
  targetSurvey,
  sourceItemsByCategoryUuid,
  targetItemsByCategoryUuid,
  result,
  selectedIds,
  usedNodeDefUuids = [],
}: SurveyCompareParams & {
  result: SurveyCompareResult
  selectedIds: string[]
  usedNodeDefUuids?: string[]
}): SurveyCompareApplyPlan => {
  const { appliedIds, skippedIds } = expandSelection({ result, selectedIds })
  const context: PlanContext = {
    sourceSurvey,
    targetSurvey,
    sourceItemsByCategoryUuid,
    targetItemsByCategoryUuid,
    result,
    usedNodeDefUuids: new Set([...usedNodeDefUuids, ...Object.keys(Survey.getNodeDefs(targetSurvey))]),
    targetCycleKeys: Survey.getCycleKeys(Survey.getSurveyInfo(targetSurvey)),
    nodeDefUuidMap: {},
    categoryUuidMap: {},
    taxonomyUuidMap: {},
  }
  buildUuidMaps({ context, appliedIds })
  const plan: SurveyCompareApplyPlan = {
    categoriesToInsert: [],
    categoryPropsToUpdate: [],
    categoryItemsToInsert: [],
    categoryItemsToUpdate: [],
    nodeDefsToInsert: [],
    nodeDefsToUpdate: [],
    appliedIds: [...appliedIds],
    skippedIds,
  }
  planCategories({ context, appliedIds, plan })
  planNodeDefs({ context, appliedIds, plan })
  return plan
}
