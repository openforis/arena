import * as R from 'ramda'
import { db } from '@server/db/db'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as NodeDefLayoutUpdater from '@core/survey/nodeDefLayoutUpdater'

import * as ObjectUtils from '@core/objectUtils'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as NodeDefRepository from '../repository/nodeDefRepository'
import { markSurveyDraft } from '../../survey/repository/surveySchemaRepositoryUtils'

export {
  addNodeDefsCycles,
  deleteNodeDefsCycles,
  permanentlyDeleteNodeDefs,
  markNodeDefsWithoutCyclesDeleted,
  updateNodeDefAnalysisCycles,
  insertNodeDefsBatch,
  updateNodeDefPropsInBatch,
} from '../repository/nodeDefRepository'

const _persistNodeDefLayout = async ({ surveyId, nodeDef }, client = db) => {
  const { uuid: nodeDefUuid, parentUuid, props } = nodeDef
  const { layout } = props
  return NodeDefRepository.updateNodeDefProps(surveyId, nodeDefUuid, parentUuid, { layout }, {}, client)
}

const _onAncestorCyclesUpdate = async ({ survey, nodeDefAncestor, cycles, cyclesPrev }, client = db) => {
  const nodeDefsUpdated = {}

  const surveyId = Survey.getId(survey)
  const surveyInfo = Survey.getSurveyInfo(survey)
  const surveyCycleKeys = Survey.getCycleKeys(surveyInfo)

  const cyclesAdded = R.difference(cycles, cyclesPrev)
  const cyclesDeleted = R.difference(cyclesPrev, cycles)

  const batchUpdates = []
  Survey.getNodeDefsArray(survey)
    .filter(NodeDef.isDescendantOf(nodeDefAncestor))
    .forEach((nodeDefDescendant) => {
      // update descendant node def
      const cyclesOld = NodeDef.getCycles(nodeDefDescendant)

      // add new cycles to descendant def
      // remove removed cycles even in descendant def
      const cyclesUpdated = surveyCycleKeys.filter(
        (cycle) => !cyclesDeleted.includes(cycle) && (cyclesOld.includes(cycle) || cyclesAdded.includes(cycle))
      )
      const nodeDefDescendantUpdated = NodeDef.assocCycles(cyclesUpdated)(nodeDefDescendant)

      const { uuid: descendantUuid, parentUuid } = nodeDefDescendantUpdated

      // add db update to batch
      batchUpdates.push(
        NodeDefRepository.updateNodeDefProps(
          surveyId,
          descendantUuid,
          parentUuid,
          { [NodeDef.propKeys.cycles]: cyclesUpdated },
          {},
          client
        )
      )
      nodeDefsUpdated[descendantUuid] = nodeDefDescendantUpdated
    })

  // perform updates in batch
  await client.batch(batchUpdates)

  return nodeDefsUpdated
}

// ======= CREATE

export const insertNodeDef = async (
  { user, survey, cycle = Survey.cycleOneKey, nodeDef: nodeDefParam, system = false, addLogs = true },
  client = db
) =>
  client.tx(async (t) => {
    const surveyId = Survey.getId(survey)

    const nodeDef = await NodeDefRepository.insertNodeDef(surveyId, nodeDefParam, t)

    const nodeDefParentUpdated = NodeDefLayoutUpdater.updateParentLayout({
      survey,
      nodeDef,
      cyclesAdded: [cycle],
    })
    if (nodeDefParentUpdated) {
      await _persistNodeDefLayout({ surveyId, nodeDef: nodeDefParentUpdated }, t)
    }
    if (addLogs) {
      await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.nodeDefCreate, nodeDefParam, system, t)
    }

    await markSurveyDraft(surveyId, t)

    return {
      [NodeDef.getUuid(nodeDef)]: nodeDef,
      ...(nodeDefParentUpdated ? { [NodeDef.getUuid(nodeDefParentUpdated)]: nodeDefParentUpdated } : {}),
    }
  })

// ======= READ

export { fetchNodeDefByUuid } from '../repository/nodeDefRepository'

export const fetchNodeDefsBySurveyId = async (
  {
    surveyId,
    cycle = null,
    draft = false,
    advanced = false,
    includeDeleted = false,
    backup = false,
    includeAnalysis = true,
  },
  client = db
) => {
  const nodeDefsDb = await NodeDefRepository.fetchNodeDefsBySurveyId(
    { surveyId, cycle, draft, advanced, includeDeleted, backup, includeAnalysis },
    client
  )
  return ObjectUtils.toUuidIndexedObj(nodeDefsDb)
}

// ======= UPDATE

export const updateNodeDefProps = async (
  { user, survey, nodeDefUuid, parentUuid, props = {}, propsAdvanced = {}, system = false },
  client = db
) =>
  client.tx(async (t) => {
    const surveyId = Survey.getId(survey)

    const nodeDefPrev = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

    const nodeDefsUpdated = {}

    // update node def into db
    const nodeDef = await NodeDefRepository.updateNodeDefProps(
      surveyId,
      nodeDefUuid,
      parentUuid,
      props,
      propsAdvanced,
      t
    )
    nodeDefsUpdated[nodeDefUuid] = nodeDef

    let surveyUpdated = Survey.mergeNodeDefs({ nodeDefs: nodeDefsUpdated })(survey)

    const updatingCycles = NodeDef.propKeys.cycles in props

    if (updatingCycles) {
      const cycles = props[NodeDef.propKeys.cycles]
      const cyclesPrev = NodeDef.getCycles(nodeDefPrev)

      if (NodeDef.isEntity(nodeDef)) {
        // Update nodeDef descendants cycles
        const nodeDefsCyclesUpdated = await _onAncestorCyclesUpdate(
          {
            survey: surveyUpdated,
            nodeDefAncestor: nodeDef,
            cycles,
            cyclesPrev,
          },
          t
        )
        Object.assign(nodeDefsUpdated, nodeDefsCyclesUpdated)
        surveyUpdated = Survey.mergeNodeDefs({ nodeDefs: nodeDefsCyclesUpdated })(surveyUpdated)
      }

      // update layout
      Object.assign(
        nodeDefsUpdated,
        NodeDefLayoutUpdater.updateLayoutOnCyclesUpdate({ survey: surveyUpdated, nodeDefUuid, cycles, cyclesPrev })
      )
      surveyUpdated = Survey.mergeNodeDefs({ nodeDefs: nodeDefsUpdated })(surveyUpdated)
    }

    const updatingLayout = NodeDefLayout.keys.layout in props

    if (updatingLayout) {
      const layout = props[NodeDefLayout.keys.layout]
      Object.assign(
        nodeDefsUpdated,
        NodeDefLayoutUpdater.updateLayout({ survey: surveyUpdated, nodeDefUuid, layout, nodeDefPrev })
      )
    }

    const logContent = {
      uuid: nodeDefUuid,
      ...(R.isEmpty(props) ? {} : { props }),
      ...(R.isEmpty(propsAdvanced) ? {} : { propsAdvanced }),
    }

    // persist changes in db
    await t.batch([
      ...Object.values(nodeDefsUpdated).map((nodeDefToUpdate) =>
        _persistNodeDefLayout({ surveyId, nodeDef: nodeDefToUpdate }, t)
      ),
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.nodeDefUpdate, logContent, system, t),
    ])

    return nodeDefsUpdated
  })

export const publishNodeDefsProps = async (surveyId, langsDeleted, client = db) => {
  await NodeDefRepository.publishNodeDefsProps(surveyId, client)

  if (!R.isEmpty(langsDeleted)) {
    // delete labels
    await Promise.all(langsDeleted.map((lang) => NodeDefRepository.deleteNodeDefsLabels(surveyId, lang, client)))
    // delete descriptions
    await Promise.all(langsDeleted.map((lang) => NodeDefRepository.deleteNodeDefsDescriptions(surveyId, lang, client)))
    // delete validation messages
    await NodeDefRepository.deleteNodeDefsValidationMessageLabels(surveyId, langsDeleted, client)
  }
}

// ======= DELETE

export const markNodeDefDeleted = async ({ user, survey, nodeDefUuid, cycle = null }, client = db) =>
  client.tx(async (t) => {
    const surveyId = Survey.getId(survey)
    const nodeDef = await NodeDefRepository.markNodeDefDeleted(surveyId, nodeDefUuid, t)

    const cyclesDeleted = cycle ? [cycle] : Survey.getCycleKeys(survey)
    const nodeDefParentUpdated = NodeDefLayoutUpdater.updateParentLayout({ survey, nodeDef, cyclesDeleted })
    if (nodeDefParentUpdated) {
      await _persistNodeDefLayout({ surveyId, nodeDef: nodeDefParentUpdated }, t)
    }

    await markSurveyDraft(surveyId, t)

    const logContent = { uuid: nodeDefUuid, name: NodeDef.getName(nodeDef) }
    await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.nodeDefMarkDeleted, logContent, false, t)

    return {
      [nodeDefUuid]: nodeDef,
      ...(nodeDefParentUpdated ? { [nodeDefParentUpdated.uuid]: nodeDefParentUpdated } : {}),
    }
  })
