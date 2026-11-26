import type {
  ArenaAnyNodeDef,
  ArenaChain,
  ArenaNodeDefEntityChildPosition,
  ArenaNodeDefMap,
  ArenaNodeDefPropsAdvanced,
  ArenaSurvey,
  ArenaUser,
  ArenaValidation,
  NodeDefType,
} from '@openforis/arena-core'

import { ColumnNodeDef } from '@common/model/db'
import * as A from '@core/arena'
import * as ObjectUtils from '@core/objectUtils'
import type { AggregateFunctionItem } from '@core/survey/aggregateFunction'
import { validateAggregateFunction } from '@core/survey/aggregateFunctionValidator'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Survey from '@core/survey/survey'
import * as SurveyValidator from '@core/survey/surveyValidator'
import SystemError, { StatusCodes } from '@core/systemError'
import * as Validation from '@core/validation/validation'
import { db, DbClient } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as TaxonomyManager from '@server/modules/taxonomy/manager/taxonomyManager'
import * as NodeDefManager from '../manager/nodeDefManager'
import type { NodeDefPropsUpdate } from '../repository/nodeDefRepository'

const fetchSurvey = ({ surveyId, cycle }: { surveyId: number; cycle?: string }, client: DbClient = db) =>
  SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
    { surveyId, cycle, draft: true, advanced: true, validate: false },
    client
  )

const _validateNodeDefs = async ({
  survey,
  nodeDef,
  updatedNodeDefs,
  nodeDefsDependentByUuid,
}: {
  survey: ArenaSurvey
  nodeDef: ArenaAnyNodeDef
  updatedNodeDefs: ArenaNodeDefMap
  nodeDefsDependentByUuid: Record<string, any>
}) => {
  const nodeDefsToValidateByUuid: ArenaNodeDefMap = {}

  // always re-validate parent entity (keys may have been changed)
  const nodeDefParent = !nodeDef || NodeDef.isRoot(nodeDef) ? null : Survey.getNodeDefParent(nodeDef)(survey)
  if (nodeDefParent) {
    nodeDefsToValidateByUuid[NodeDef.getUuid(nodeDefParent)] = nodeDefParent
  }
  Object.assign(nodeDefsToValidateByUuid, updatedNodeDefs, nodeDefsDependentByUuid)

  const nodeDefsToValidate = Object.values(nodeDefsToValidateByUuid)

  // perform node defs validation
  const nodeDefsValidationArray = await Promise.all(
    nodeDefsToValidate.map((nodeDefToValidate) => SurveyValidator.validateNodeDef(survey, nodeDefToValidate))
  )
  const nodeDefsValidationsByUuid: Record<string, ArenaValidation> = {}
  for (const [index, nodeDefToValidate] of nodeDefsToValidate.entries()) {
    nodeDefsValidationsByUuid[NodeDef.getUuid(nodeDefToValidate)] = nodeDefsValidationArray[index]
  }
  const valid = nodeDefsValidationArray.every((validation) => Validation.isValid(validation))

  return Validation.newInstance(valid, nodeDefsValidationsByUuid)
}

const afterNodeDefUpdate = async ({
  survey,
  nodeDef = null,
  nodeDefsDependentsUuids = [],
  nodeDefsUpdated = {},
}: {
  survey: ArenaSurvey
  nodeDef?: ArenaAnyNodeDef
  nodeDefsDependentsUuids?: string[]
  nodeDefsUpdated?: ArenaNodeDefMap
}) => {
  const allUpdatedNodeDefs: ArenaNodeDefMap = { ...nodeDefsUpdated }
  if (nodeDef && !allUpdatedNodeDefs[NodeDef.getUuid(nodeDef)]) {
    allUpdatedNodeDefs[NodeDef.getUuid(nodeDef)] = nodeDef
  }
  const updatedNodeDefsNotDeleted = ObjectUtils.toUuidIndexedObj(
    Object.values(allUpdatedNodeDefs).filter((def) => !NodeDef.isDeleted(def))
  )

  // merge node defs with existing ones
  let surveyUpdated = Survey.mergeNodeDefs(allUpdatedNodeDefs)(survey)

  // add dependent node defs to dependency graph
  // nodeDefsDependent can contain nodeDefs that have been updated and are in nodeDefsUpdated too: replace them with the updated ones
  const nodeDefDependents = Survey.getNodeDefsByUuids(nodeDefsDependentsUuids)(surveyUpdated)
  const nodeDefsDependentByUuid = ObjectUtils.toUuidIndexedObj(nodeDefDependents)

  surveyUpdated = await Survey.addNodeDefsDependencies({ ...updatedNodeDefsNotDeleted, ...nodeDefsDependentByUuid })(
    surveyUpdated
  )

  const dependencyGraph = Survey.getDependencyGraph(surveyUpdated)

  const nodeDefsValidation = await _validateNodeDefs({
    survey: surveyUpdated,
    nodeDef,
    updatedNodeDefs: allUpdatedNodeDefs,
    nodeDefsDependentByUuid,
  })

  return { dependencyGraph, nodeDefsUpdated: allUpdatedNodeDefs, nodeDefsValidation }
}

export const fetchNodeDef = (
  {
    surveyId,
    draft,
    advanced,
    nodeDefUuid,
  }: { surveyId: number; draft: boolean; advanced: boolean; nodeDefUuid: string },
  client: DbClient = db
) => NodeDefManager.fetchNodeDefByUuid(surveyId, nodeDefUuid, draft, advanced, client)

export const insertNodeDef = (
  {
    user,
    surveyId,
    cycle = Survey.cycleOneKey,
    nodeDef,
  }: { user: ArenaUser; surveyId: number; cycle?: string; nodeDef: ArenaAnyNodeDef },
  client: DbClient = db
) =>
  client.tx(async (t) => {
    const survey = await fetchSurvey({ surveyId, cycle }, t)

    const nodeDefsUpdated = await NodeDefManager.insertNodeDef({ user, survey, cycle, nodeDef }, t)
    const surveyUpdated = Survey.assocNodeDef({ nodeDef })(survey)

    return afterNodeDefUpdate({ survey: surveyUpdated, nodeDef, nodeDefsUpdated })
  })

export const insertNodeDefs = (
  {
    user: _user,
    surveyId,
    cycle = Survey.cycleOneKey,
    nodeDefs,
  }: { user: ArenaUser; surveyId: number; cycle?: string; nodeDefs: ArenaAnyNodeDef[] },
  client: DbClient = db
) =>
  client.tx(async (t) => {
    const survey = await fetchSurvey({ surveyId, cycle }, t)

    await NodeDefManager.insertNodeDefsBatch({ surveyId, nodeDefs }, t)

    // the inserted node defs are merged into the survey by afterNodeDefUpdate
    return afterNodeDefUpdate({ survey, nodeDefsUpdated: ObjectUtils.toUuidIndexedObj(nodeDefs) })
  })

/**
 * Throws an error if the custom aggregate functions being saved are not valid (e.g. not allowed SQL in the expression).
 * @param {object} params - The parameters.
 * @param {string} params.nodeDefUuid - The UUID of the node definition being updated.
 * @param {object} params.propsAdvanced - The advanced props being saved.
 * @returns {Promise<void>} - The validation promise.
 */
const _checkAggregateFunctions = async ({
  survey,
  nodeDefUuid,
  propsAdvanced,
}: {
  survey: ArenaSurvey
  nodeDefUuid: string
  propsAdvanced: ArenaNodeDefPropsAdvanced
}) => {
  const aggregateFunctions = propsAdvanced[NodeDef.keysPropsAdvanced.aggregateFunctions]
  const nodeDefPrev = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  if (!aggregateFunctions || !nodeDefPrev) return

  const nodeDef = NodeDef.mergePropsAdvanced(propsAdvanced)(nodeDefPrev)
  // the function can be used in queries of any entity whose data view includes the measure: allow any survey column
  const columnNames = Survey.getNodeDefsArray(survey).flatMap((def) => ColumnNodeDef.getColumnNames(def))
  const aggregateFunctionsArray = Object.values(aggregateFunctions) as AggregateFunctionItem[]
  const validations = await Promise.all(
    aggregateFunctionsArray.map((aggregateFunction) =>
      validateAggregateFunction({ aggregateFunction, nodeDef, columnNames })
    )
  )
  const invalidIndex = validations.findIndex((validation) => !Validation.isValid(validation))
  if (invalidIndex >= 0) {
    const name = aggregateFunctionsArray[invalidIndex]?.name
    throw new SystemError('appErrors:aggregateFunctionInvalid', { name }, StatusCodes.BAD_REQUEST)
  }
}

export const updateNodeDefProps = (
  {
    user,
    surveyId,
    cycle,
    nodeDefUuid,
    parentUuid,
    props = {},
    propsAdvanced = {},
    system = false,
  }: {
    user: ArenaUser
    surveyId: number
    cycle?: string
    nodeDefUuid: string
    parentUuid: string
    props?: Record<string, any>
    propsAdvanced?: ArenaNodeDefPropsAdvanced
    system?: boolean
  },
  client: DbClient = db
) =>
  client.tx(async (t) => {
    const survey = await fetchSurvey({ surveyId, cycle }, t)

    await _checkAggregateFunctions({ survey, nodeDefUuid, propsAdvanced })

    const nodeDefsDependentsUuids = Survey.getNodeDefDependentsUuids(nodeDefUuid)(survey)

    // remove dependent node defs from dependency graph (add them back later)
    const surveyUpdated = Survey.removeNodeDefDependencies(nodeDefUuid)(survey)

    const nodeDefsUpdated = await NodeDefManager.updateNodeDefProps(
      { user, survey, nodeDefUuid, parentUuid, props, propsAdvanced, system },
      t
    )
    const nodeDef = nodeDefsUpdated[nodeDefUuid]

    return afterNodeDefUpdate({ survey: surveyUpdated, nodeDef, nodeDefsDependentsUuids, nodeDefsUpdated })
  })

const _touchesRefProps = ({ props = {} }: NodeDefPropsUpdate): boolean =>
  NodeDef.propKeys.categoryUuid in props || NodeDef.propKeys.taxonomyUuid in props

// `survey` can be given by a caller that has it already
export const updateNodeDefsProps = async (
  {
    surveyId,
    cycle,
    nodeDefs,
    survey = null,
  }: { surveyId: number; cycle?: string; nodeDefs: NodeDefPropsUpdate[]; survey?: ArenaSurvey | null },
  client: DbClient = db
) => {
  // the category and taxonomy of a published attribute are locked (as in updateNodeDefProps): the survey is only
  // loaded when the batch touches them
  if (nodeDefs.some(_touchesRefProps)) {
    const surveyDraft = survey ?? (await fetchSurvey({ surveyId, cycle }, client))
    NodeDefManager.assertNodeDefsRefPropsCanChange({ survey: surveyDraft, nodeDefs })
  }
  return NodeDefManager.updateNodeDefPropsInBatch({ surveyId, nodeDefs }, client)
}

export const moveNodeDef = (
  {
    user,
    surveyId,
    nodeDefUuid,
    targetParentNodeDefUuid,
  }: { user: ArenaUser; surveyId: number; nodeDefUuid: string; targetParentNodeDefUuid: string },
  client: DbClient = db
) =>
  client.tx(async (t) => {
    const survey = await fetchSurvey({ surveyId }, t)

    const nodeDefsDependentsUuids = Survey.getNodeDefDependentsUuids(nodeDefUuid)(survey)

    const nodeDefsUpdated = await NodeDefManager.moveNodeDef({ user, survey, nodeDefUuid, targetParentNodeDefUuid }, t)

    // remove dependent node defs from dependency graph (add them back later)
    const surveyUpdated = Survey.removeNodeDefDependencies(nodeDefUuid)(survey)

    return afterNodeDefUpdate({ survey: surveyUpdated, nodeDefsDependentsUuids, nodeDefsUpdated })
  })

export const convertNodeDef = (
  {
    user,
    surveyId,
    nodeDefUuid,
    toType,
  }: { user: ArenaUser; surveyId: number; nodeDefUuid: string; toType: NodeDefType },
  client: DbClient = db
) =>
  client.tx(async (t) => {
    const survey = await fetchSurvey({ surveyId }, t)

    const nodeDefsDependentsUuids = Survey.getNodeDefDependentsUuids(nodeDefUuid)(survey)

    const nodeDef = await NodeDefManager.convertNodeDef({ user, survey, nodeDefUuid, toType }, t)

    return afterNodeDefUpdate({ survey, nodeDef, nodeDefsDependentsUuids })
  })

/**
 * Resolves categories/taxonomies referenced by code/taxon attributes among the given cloned node defs:
 * reuses an existing category/taxonomy in the target survey (matched by uuid or name), or clones it from
 * the source survey. Cloned node defs associated with an existing item matched by name (different uuid)
 * get their categoryUuid/taxonomyUuid prop rewritten accordingly.
 * @param {object} params - The params.
 * @param {object} params.user - The user performing the clone.
 * @param {Array.<object>} params.clonedNodeDefs - The node defs cloned from the source survey.
 */
export const resolveAndCloneNodeDefsCategoriesAndTaxonomies = async (
  {
    user,
    sourceSurveyId,
    sourceSurvey,
    targetSurveyId,
    targetSurvey,
    clonedNodeDefs,
  }: {
    user: ArenaUser
    sourceSurveyId: number
    sourceSurvey: ArenaSurvey
    targetSurveyId: number
    targetSurvey: ArenaSurvey
    clonedNodeDefs: ArenaAnyNodeDef[]
  },
  client: DbClient = db
) => {
  const {
    clonedNodeDefs: resolvedClonedNodeDefs,
    categoryUuidsToClone,
    taxonomyUuidsToClone,
  } = Survey.resolveClonedNodeDefsCategoriesAndTaxonomies({ sourceSurvey, targetSurvey, clonedNodeDefs })

  const categoriesCloned = []
  for (const sourceCategoryUuid of categoryUuidsToClone) {
    categoriesCloned.push(
      /* NOSONAR */ await CategoryManager.cloneCategoryFromSurvey(
        { user, sourceSurveyId, sourceCategoryUuid, targetSurveyId },
        client
      )
    )
  }
  const taxonomiesCloned = []
  for (const sourceTaxonomyUuid of taxonomyUuidsToClone) {
    taxonomiesCloned.push(
      /* NOSONAR */ await TaxonomyManager.cloneTaxonomyFromSurvey(
        { user, sourceSurveyId, sourceTaxonomyUuid, targetSurveyId },
        client
      )
    )
  }

  return { clonedNodeDefs: resolvedClonedNodeDefs, categoriesCloned, taxonomiesCloned }
}

export const cloneNodeDefFromSurvey = (
  {
    user,
    sourceSurveyId,
    sourceNodeDefUuid,
    targetSurveyId,
    targetParentNodeDefUuid,
  }: {
    user: ArenaUser
    sourceSurveyId: number
    sourceNodeDefUuid: string
    targetSurveyId: number
    targetParentNodeDefUuid: string
  },
  client: DbClient = db
) =>
  client.tx(async (t) => {
    const [sourceSurvey, targetSurvey] = await DbUtils.runQueries(t, [
      () => fetchSurvey({ surveyId: sourceSurveyId }, t),
      () => fetchSurvey({ surveyId: targetSurveyId }, t),
    ])

    // Temporarily inject the source node def subtree into the target survey so
    // Survey.cloneNodeDef can resolve references within a single survey object.
    const sourceNodeDef = Survey.getNodeDefByUuid(sourceNodeDefUuid)(sourceSurvey)
    const sourceDescendants = Survey.getNodeDefDescendants({ nodeDef: sourceNodeDef })(sourceSurvey)
    const sourceNodeDefs = ObjectUtils.toUuidIndexedObj([sourceNodeDef, ...sourceDescendants])
    const mergedSurvey = Survey.mergeNodeDefs(sourceNodeDefs)(targetSurvey)

    const existingNodeDefNames = Survey.getNodeDefsArray(targetSurvey).map((nd) => NodeDef.getName(nd))
    const { clonedNodeDefs, rootClonedNodeDef } = Survey.cloneNodeDef({
      nodeDefUuid: sourceNodeDefUuid,
      targetParentNodeDefUuid,
      existingNodeDefNames,
    })(mergedSurvey)

    // Resolve categories/taxonomies referenced by code/taxon attributes in the cloned subtree:
    // reuse an existing one (by uuid or name), or clone it from the source survey.
    const {
      clonedNodeDefs: resolvedClonedNodeDefs,
      categoriesCloned,
      taxonomiesCloned,
    } = await resolveAndCloneNodeDefsCategoriesAndTaxonomies(
      { user, sourceSurveyId, sourceSurvey, targetSurveyId, targetSurvey, clonedNodeDefs },
      t
    )

    const rootClonedNodeDefResolved = resolvedClonedNodeDefs.find(
      (nd) => NodeDef.getUuid(nd) === NodeDef.getUuid(rootClonedNodeDef)
    )

    const { nodeDefsUpdated, nodeDefsValidation } = await _insertClonedNodeDefsAndUpdateLayout({
      survey: targetSurvey,
      surveyId: targetSurveyId,
      clonedNodeDefs: resolvedClonedNodeDefs,
      rootClonedNodeDef: rootClonedNodeDefResolved,
      layoutRefParentNodeDefUuid: targetParentNodeDefUuid,
      layoutRefNodeDefUuid: sourceNodeDefUuid,
      t,
    })

    return { nodeDefsUpdated, nodeDefsValidation, categoriesCloned, taxonomiesCloned }
  })

const _insertClonedNodeDefsAndUpdateLayout = async ({
  survey,
  surveyId,
  clonedNodeDefs,
  rootClonedNodeDef,
  layoutRefParentNodeDefUuid,
  layoutRefNodeDefUuid,
  t,
}: {
  survey: ArenaSurvey
  surveyId: number
  clonedNodeDefs: ArenaAnyNodeDef[]
  rootClonedNodeDef: ArenaAnyNodeDef
  layoutRefParentNodeDefUuid: string
  layoutRefNodeDefUuid: string
  t: DbClient
}) => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  const cycleKeys = Survey.getCycleKeys(survey)
  const defaultCycle = Survey.getDefaultCycleKey(surveyInfo)
  const layoutRefParentNodeDef = Survey.getNodeDefByUuid(layoutRefParentNodeDefUuid)(survey)
  const isLayoutRefParentForm = NodeDefLayout.isRenderForm(defaultCycle)(layoutRefParentNodeDef)
  const layoutRefParentChildren = NodeDefLayout.getLayoutChildren(defaultCycle)(layoutRefParentNodeDef)
  const layoutRefPosition = isLayoutRefParentForm
    ? layoutRefParentChildren.find(
        (item): item is ArenaNodeDefEntityChildPosition => typeof item !== 'string' && item.i === layoutRefNodeDefUuid
      )
    : null

  const insertedNodeDefs = await NodeDefManager.insertNodeDefsBatch({ surveyId, nodeDefs: clonedNodeDefs }, t)

  const preferredLayoutByCycle = layoutRefPosition
    ? cycleKeys.reduce((acc, cycle) => {
        const { minH, minW, h, w } = layoutRefPosition
        acc[cycle] = { minH, minW, h, w }
        return acc
      }, {})
    : null
  const parentNodeDefUpdated = await NodeDefManager.addOrRemoveNodeDefInParentLayout(
    {
      survey,
      nodeDef: rootClonedNodeDef,
      add: true,
      layoutInParentByCycle: preferredLayoutByCycle,
    },
    t
  )

  const nodeDefsUpdatedByUuid = ObjectUtils.toUuidIndexedObj(insertedNodeDefs)
  if (parentNodeDefUpdated) {
    nodeDefsUpdatedByUuid[NodeDef.getUuid(parentNodeDefUpdated)] = parentNodeDefUpdated
  }

  return afterNodeDefUpdate({ survey, nodeDefsUpdated: nodeDefsUpdatedByUuid })
}

export const cloneNodeDef = (
  {
    surveyId,
    nodeDefUuid,
    targetParentNodeDefUuid,
  }: { surveyId: number; nodeDefUuid: string; targetParentNodeDefUuid: string },
  client: DbClient = db
) =>
  client.tx(async (t) => {
    const survey = await fetchSurvey({ surveyId }, t)

    const { clonedNodeDefs, rootClonedNodeDef } = Survey.cloneNodeDef({ nodeDefUuid, targetParentNodeDefUuid })(survey)

    const originalNodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    const originalNodeDefParent = Survey.getNodeDefParent(originalNodeDef)(survey)

    return _insertClonedNodeDefsAndUpdateLayout({
      survey,
      surveyId,
      clonedNodeDefs,
      rootClonedNodeDef,
      layoutRefParentNodeDefUuid: NodeDef.getUuid(originalNodeDefParent),
      layoutRefNodeDefUuid: nodeDefUuid,
      t,
    })
  })

export const fetchNodeDefsUpdatedAndValidated = async (
  {
    user: _user,
    surveyId,
    cycle,
    nodeDefsUpdated,
  }: { user: ArenaUser; surveyId: number; cycle: string; nodeDefsUpdated: ArenaNodeDefMap },
  client: DbClient = db
) => {
  const survey = await fetchSurvey({ surveyId, cycle }, client)

  return afterNodeDefUpdate({ survey, nodeDefsUpdated })
}

/**
 * Reassigns a contiguous 0..n-1 chain index to the analysis node defs remaining in the same chain
 * after one has been deleted, so that deleting a variable never leaves permanent gaps in the sibling
 * indices.
 *
 * NOTE: `survey` is the pre-deletion survey snapshot (fetched before `markNodeDefDeleted` ran).
 * `nodeDefDeleted` may therefore still appear in the results of `Survey.getAnalysisNodeDefs`;
 * the explicit `.filter(...)` below is the sole guard that excludes it from the reindexing.
 * @param {object} params - Parameters.
 * @param {object} params.survey - The survey object (pre-deletion snapshot).
 * @param {object} params.nodeDefDeleted - The analysis node def that was just deleted.
 * @param {object} client - The database client / transaction.
 * @returns {Promise<object>} UUID-indexed map of the reindexed node defs (may be empty if no reindexing was needed).
 */
const _reindexAnalysisNodeDefsAfterDelete = async (
  { survey, surveyId, nodeDefDeleted }: { survey: ArenaSurvey; surveyId: number; nodeDefDeleted: ArenaAnyNodeDef },
  client: DbClient
) => {
  const chainUuid = NodeDef.getChainUuid(nodeDefDeleted)
  const siblingAnalysisNodeDefs = Survey.getAnalysisNodeDefs({
    chain: { uuid: chainUuid } as ArenaChain,
    showSamplingNodeDefs: false,
    showInactiveResultVariables: true,
  })(survey).filter((sibling) => NodeDef.getUuid(sibling) !== NodeDef.getUuid(nodeDefDeleted))

  const nodeDefsToReindex = siblingAnalysisNodeDefs.reduce((acc, sibling, index) => {
    if (NodeDef.getChainIndex(sibling) !== index) {
      acc.push({ nodeDefUuid: NodeDef.getUuid(sibling), propsAdvanced: { [NodeDef.keysPropsAdvanced.index]: index } })
    }
    return acc
  }, [])
  if (nodeDefsToReindex.length === 0) return {}

  const nodeDefsReindexed = await NodeDefManager.updateNodeDefPropsInBatch(
    { surveyId, nodeDefs: nodeDefsToReindex },
    client
  )
  return ObjectUtils.toUuidIndexedObj(nodeDefsReindexed)
}

export const markNodeDefDeleted = (
  { user, surveyId, cycle, nodeDefUuid }: { user: ArenaUser; surveyId: number; cycle: string; nodeDefUuid: string },
  client: DbClient = db
) =>
  client.tx(async (t) => {
    const survey = await fetchSurvey({ surveyId, cycle }, t)

    const nodeDefsDependentsUuids = Survey.getNodeDefDependentsUuids(nodeDefUuid)(survey)

    const nodeDefToDelete = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

    let nodeDefsUpdated = await NodeDefManager.markNodeDefDeleted({ user, survey, cycle, nodeDefUuid }, t)

    if (NodeDef.isAnalysis(nodeDefToDelete) && !NodeDef.isSampling(nodeDefToDelete)) {
      const nodeDefsReindexed = await _reindexAnalysisNodeDefsAfterDelete(
        { survey, surveyId, nodeDefDeleted: nodeDefToDelete },
        t
      )
      nodeDefsUpdated = { ...nodeDefsUpdated, ...nodeDefsReindexed }
    }

    // remove dependent node defs from dependency graph (add them back later)
    const surveyUpdated = Survey.removeNodeDefDependencies(nodeDefUuid)(survey)

    const nodeDef = nodeDefsUpdated[nodeDefUuid]

    return afterNodeDefUpdate({ survey: surveyUpdated, nodeDef, nodeDefsDependentsUuids, nodeDefsUpdated })
  })

export const markNodeDefsDeleted = async (
  {
    user,
    surveyId,
    cycle,
    nodeDefUuids,
  }: { user: ArenaUser; surveyId: number; cycle?: string; nodeDefUuids: string[] },
  client: DbClient = db
) => {
  let response = { nodeDefsUpdated: {}, nodeDefsValidation: {} }

  for (const nodeDefUuid of nodeDefUuids) {
    const _response = await markNodeDefDeleted({ user, surveyId, cycle, nodeDefUuid }, client) // NOSONAR
    response = A.mergeDeepLeft(response, _response)
  }

  return response
}

export {
  // ======  READ - entities
  countVirtualEntities,
  fetchVirtualEntities,
} from '../repository/nodeDefRepository'
