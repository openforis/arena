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
} from '../repository/nodeDefRepository'

const _updateNodeDef = ({ surveyId, nodeDef }, client = db) =>
  NodeDefRepository.updateNodeDefProps(
    surveyId,
    nodeDef.uuid,
    nodeDef.parentUuid,
    nodeDef.props,
    nodeDef.propsAdvanced,
    client
  )

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
      await _updateNodeDef({ surveyId, nodeDef: nodeDefParentUpdated }, t)
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
  { surveyId, cycle = null, draft = false, advanced = false, includeDeleted = false, backup = false },
  client = db
) => {
  const nodeDefsDb = await NodeDefRepository.fetchNodeDefsBySurveyId(
    { surveyId, cycle, draft, advanced, includeDeleted, backup },
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

    const updatingCycles = NodeDef.propKeys.cycles in props

    // node defs with changes to be stored in the db
    const nodeDefsUpdated = updatingCycles
      ? NodeDefLayoutUpdater.updateLayoutOnCyclesUpdate({
          survey,
          nodeDefUuid,
          cycles: props[NodeDef.propKeys.cycles],
        })
      : {}

    if (NodeDefLayout.keys.layout in props) {
      let surveyUpdated = Survey.mergeNodeDefs({ nodeDefs: nodeDefsUpdated })(survey)
      const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
      const layoutToUpdate = props[NodeDefLayout.keys.layout]
      const layoutEntries = Object.entries(layoutToUpdate)

      layoutEntries.forEach(([surveyCycleKey, layoutCycle]) => {
        Object.entries(layoutCycle).forEach(([key, value]) => {
          Object.assign(
            nodeDefsUpdated,
            Survey.updateLayoutProp({ surveyCycleKey, nodeDef, key, value })(surveyUpdated)
          )
          surveyUpdated = Survey.mergeNodeDefs({ nodeDefs: nodeDefsUpdated })(surveyUpdated)
        })
      })
    }

    const logContent = {
      uuid: nodeDefUuid,
      ...(R.isEmpty(props) ? {} : { props }),
      ...(R.isEmpty(propsAdvanced) ? {} : { propsAdvanced }),
    }

    // persist changes in db
    const [nodeDef] = await t.batch([
      NodeDefRepository.updateNodeDefProps(surveyId, nodeDefUuid, parentUuid, props, propsAdvanced, t),
      ...Object.values(nodeDefsUpdated).map((nodeDefToUpdate) =>
        _updateNodeDef({ surveyId, nodeDef: nodeDefToUpdate }, t)
      ),
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.nodeDefUpdate, logContent, system, t),
    ])

    return {
      [nodeDefUuid]: nodeDef,
      ...nodeDefsUpdated,
    }
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

export const markNodeDefDeleted = async ({ user, survey, cycle, nodeDefUuid }, client = db) =>
  client.tx(async (t) => {
    const surveyId = Survey.getId(survey)
    const nodeDef = await NodeDefRepository.markNodeDefDeleted(surveyId, nodeDefUuid, t)

    const nodeDefParentUpdated = NodeDefLayoutUpdater.updateParentLayout({ survey, nodeDef, cyclesDeleted: [cycle] })
    if (nodeDefParentUpdated) {
      await _updateNodeDef({ surveyId, nodeDef: nodeDefParentUpdated }, t)
    }

    await markSurveyDraft(surveyId, t)

    const logContent = { uuid: nodeDefUuid, name: NodeDef.getName(nodeDef) }
    await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.nodeDefMarkDeleted, logContent, false, t)

    return {
      [nodeDefUuid]: nodeDef,
      ...(nodeDefParentUpdated ? [nodeDefParentUpdated.uuid] : nodeDefParentUpdated),
    }
  })
