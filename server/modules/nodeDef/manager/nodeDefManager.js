import * as R from 'ramda'
import { db } from '@server/db/db'

import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as NodeDefLayoutUpdater from '@core/survey/nodeDefLayoutUpdater'

import * as ObjectUtils from '@core/objectUtils'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as NodeDefRepository from '../repository/nodeDefRepository'
import { markSurveyDraft } from '../../survey/repository/surveySchemaRepositoryUtils'
import { NodeDefAreaBasedEstimateManager } from './nodeDefAreaBasedEstimateManager'

export {
  addNodeDefsCycles,
  deleteNodeDefsCycles,
  deleteOrphaneNodeDefs,
  permanentlyDeleteNodeDefs,
  markNodeDefsWithoutCyclesDeleted,
  updateNodeDefAnalysisCycles,
  insertNodeDefsBatch,
  updateNodeDefPropsInBatch,
  unpublishNodeDefsProps,
} from '../repository/nodeDefRepository'

const _persistNodeDefLayout = async ({ surveyId, nodeDef }, client = db) => {
  const { uuid: nodeDefUuid, parentUuid, props } = nodeDef
  const { layout } = props
  return NodeDefRepository.updateNodeDefProps({ surveyId, nodeDefUuid, parentUuid, props: { layout } }, client)
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
          {
            surveyId,
            nodeDefUuid: descendantUuid,
            parentUuid,
            props: { [NodeDef.propKeys.cycles]: cyclesUpdated },
          },
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

    const areaEstimatedNodeDef = NodeDef.hasAreaBasedEstimated(nodeDef)
      ? await NodeDefAreaBasedEstimateManager.insertNodeDefAreaBasedEstimate(
          { survey, chainUuid: NodeDef.getChainUuid(nodeDef), estimatedOfNodeDef: nodeDef },
          t
        )
      : null

    if (addLogs) {
      await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.nodeDefCreate, nodeDefParam, system, t)
    }

    await markSurveyDraft(surveyId, t)

    return {
      [NodeDef.getUuid(nodeDef)]: nodeDef,
      ...(nodeDefParentUpdated ? { [NodeDef.getUuid(nodeDefParentUpdated)]: nodeDefParentUpdated } : {}),
      ...(areaEstimatedNodeDef ? { [NodeDef.getUuid(areaEstimatedNodeDef)]: areaEstimatedNodeDef } : {}),
    }
  })

// ======= READ

export { fetchNodeDefByUuid } from '../repository/nodeDefRepository'

const _fixMetaHierarchy = ({ nodeDefsByUuid, nodeDef }) => {
  const h = []
  let currentNodeDef = nodeDef
  while (currentNodeDef) {
    const parentUuid = NodeDef.getParentUuid(currentNodeDef)
    if (parentUuid) {
      h.unshift(parentUuid)
    }
    currentNodeDef = nodeDefsByUuid[parentUuid]
  }
  nodeDefsByUuid[NodeDef.getUuid(nodeDef)] = NodeDef.assocMetaHierarchy(h)(nodeDef)
}

const _filterOutInvalidNodeDefs = (nodeDefsByUuid) => {
  Object.entries(nodeDefsByUuid).forEach(([nodeDefUuid, nodeDef]) => {
    const parentUuid = NodeDef.getParentUuid(nodeDef)
    // invalid parent UUID
    if (parentUuid && !nodeDefsByUuid[parentUuid]) {
      delete nodeDefsByUuid[nodeDefUuid]
    } else if (parentUuid && NodeDef.getMetaHierarchy(nodeDef).length === 0) {
      _fixMetaHierarchy({ nodeDefsByUuid, nodeDef })
    }
  })
  return nodeDefsByUuid
}

const _calculateNodeDefHierarchy = ({ nodeDef, nodeDefsByUuid }) => {
  const hiearchy = []
  let currentParentUuid = NodeDef.getParentUuid(nodeDef)
  while (currentParentUuid) {
    hiearchy.unshift(currentParentUuid)
    const currentParentNode = nodeDefsByUuid[currentParentUuid]
    currentParentUuid = NodeDef.getParentUuid(currentParentNode)
  }
  return hiearchy
}

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
  const nodeDefsByUuid = ObjectUtils.toUuidIndexedObj(nodeDefsDb)

  // re-calculate node defs hierarchy (it could be wrong)
  nodeDefsDb.forEach((nodeDef) => {
    const hierarchy = _calculateNodeDefHierarchy({ nodeDef, nodeDefsByUuid })
    Objects.setInPath({ obj: nodeDef, path: [NodeDef.keys.meta, NodeDef.metaKeys.h], value: hierarchy })
  })

  return _filterOutInvalidNodeDefs(nodeDefsByUuid)
}

// ======= UPDATE

const _propsUpdateRequiresParentLayoutUpdate = ({ nodeDef, props }) =>
  NodeDef.isCoordinate(nodeDef) &&
  R.intersection(Object.keys(props))([
    NodeDef.propKeys.includeAccuracy,
    NodeDef.propKeys.includeAltitude,
    NodeDef.propKeys.includeAltitudeAccuracy,
  ]).length > 0

export const updateNodeDefProps = async (
  { user, survey, nodeDefUuid, parentUuid, props = {}, propsAdvanced = {}, system = false, markSurveyAsDraft = true },
  client = db
) =>
  client.tx(async (t) => {
    const surveyId = Survey.getId(survey)

    const nodeDefPrev = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

    const nodeDefsUpdated = {}
    let surveyUpdated = survey

    const _addNodeDefsUpdatedToSurvey = (nodeDefs) => {
      Object.assign(nodeDefsUpdated, nodeDefs)
      surveyUpdated = Survey.mergeNodeDefs(nodeDefs)(surveyUpdated)
    }

    const _addNodeDefUpdatedToSurvey = (nodeDef) => {
      if (nodeDef) {
        _addNodeDefsUpdatedToSurvey({ [NodeDef.getUuid(nodeDef)]: nodeDef })
      }
    }

    // update node def into db
    const nodeDef = await NodeDefRepository.updateNodeDefProps(
      {
        surveyId,
        nodeDefUuid,
        parentUuid,
        props,
        propsAdvanced,
      },
      t
    )
    _addNodeDefUpdatedToSurvey(nodeDef)

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
        _addNodeDefsUpdatedToSurvey(nodeDefsCyclesUpdated)
      }

      // update layout
      _addNodeDefsUpdatedToSurvey(
        NodeDefLayoutUpdater.updateLayoutOnCyclesUpdate({
          survey: surveyUpdated,
          nodeDefUuid,
          cycles,
          cyclesPrev,
        })
      )
    }

    if (_propsUpdateRequiresParentLayoutUpdate({ nodeDef, props })) {
      const nodeDefParent = Survey.getNodeDefParent(nodeDef)(surveyUpdated)
      const nodeDefParentUpdated = NodeDefLayoutUpdater.adjustLayoutChildrenHeights({
        survey: surveyUpdated,
        nodeDef: nodeDefParent,
      })
      _addNodeDefUpdatedToSurvey(nodeDefParentUpdated)
    }

    const updatingLayout = NodeDefLayout.keys.layout in props

    if (updatingLayout) {
      const layout = props[NodeDefLayout.keys.layout]
      const nodeDefsLayoutUpdated = NodeDefLayoutUpdater.updateLayout({
        survey: surveyUpdated,
        nodeDefUuid,
        layout,
        nodeDefPrev,
      })
      _addNodeDefsUpdatedToSurvey(nodeDefsLayoutUpdated)
    }

    if (NodeDef.isAnalysis(nodeDef)) {
      const hasAreaBasedEstimateChanged =
        NodeDef.keysPropsAdvanced.hasAreaBasedEstimated in propsAdvanced &&
        NodeDef.hasAreaBasedEstimated(nodeDefPrev) !== NodeDef.hasAreaBasedEstimated(nodeDef)

      if (hasAreaBasedEstimateChanged) {
        const nodeDefAreaBasedEstimateUpdated =
          await NodeDefAreaBasedEstimateManager.insertOrDeleteNodeDefAreaBasedEstimate({ survey, nodeDef }, t)
        _addNodeDefUpdatedToSurvey(nodeDefAreaBasedEstimateUpdated)
      } else {
        // node def name or label changed => update node def area based estimate generated name or label
        const nameOrLabelChanged =
          (NodeDef.propKeys.name in props && NodeDef.getName(nodeDefPrev) !== NodeDef.getName(nodeDef)) ||
          (NodeDef.propKeys.labels in props &&
            !Objects.isEqual(NodeDef.getLabels(nodeDefPrev), NodeDef.getLabels(nodeDef)))

        if (nameOrLabelChanged) {
          const nodeDefAreaBasedEstimateUpdated = await NodeDefAreaBasedEstimateManager.updateNodeDefAreaBasedEstimate(
            { survey, nodeDef },
            t
          )
          _addNodeDefUpdatedToSurvey(nodeDefAreaBasedEstimateUpdated)
        }
      }
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
      ...(markSurveyAsDraft ? [markSurveyDraft(surveyId, t)] : []),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.nodeDefUpdate, logContent, system, t),
    ])

    return nodeDefsUpdated
  })

export const moveNodeDef = async ({ user, survey, nodeDefUuid, targetParentNodeDefUuid }, client = db) =>
  client.tx(async (t) => {
    const result = {}

    const addOrRemoveInParentLayout = async ({ nodeDef, add = true }) => {
      const parentUpdated = NodeDefLayoutUpdater.updateParentLayout({
        survey,
        nodeDef,
        cyclesAdded: add ? NodeDef.getCycles(nodeDef) : [],
        cyclesDeleted: add ? [] : NodeDef.getCycles(nodeDef),
      })
      if (parentUpdated) {
        await _persistNodeDefLayout({ surveyId, nodeDef: parentUpdated }, t)
        result[NodeDef.getUuid(parentUpdated)] = parentUpdated
      }
    }

    const surveyId = Survey.getId(survey)

    const nodeDefSource = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

    // remove source node def from parent layout
    await addOrRemoveInParentLayout({ nodeDef: nodeDefSource, add: false })

    const targetParentNodeDef = Survey.getNodeDefByUuid(targetParentNodeDefUuid)(survey)

    // update source node def parent uuid and meta
    let nodeDefUpdated = NodeDef.changeParentEntity({ targetParentNodeDef })(nodeDefSource)

    nodeDefUpdated = await NodeDefRepository.updateNodeDefProps(
      {
        surveyId,
        nodeDefUuid,
        parentUuid: targetParentNodeDefUuid,
        meta: NodeDef.getMeta(nodeDefUpdated),
      },
      t
    )

    result[nodeDefUuid] = nodeDefUpdated

    // add node def to target parent layout
    await addOrRemoveInParentLayout({ nodeDef: nodeDefUpdated, add: true })

    await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.nodeDefUpdate, nodeDefUpdated, false, t)

    await markSurveyDraft(surveyId, t)

    return result
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
