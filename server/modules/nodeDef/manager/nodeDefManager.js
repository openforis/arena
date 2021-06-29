import * as R from 'ramda'
import { db } from '@server/db/db'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import * as ObjectUtils from '@core/objectUtils'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as NodeDefRepository from '../repository/nodeDefRepository'
import { markSurveyDraft } from '../../survey/repository/surveySchemaRepositoryUtils'

import * as NodeDefLayoutManager from './layout'

export {
  addNodeDefsCycles,
  deleteNodeDefsCycles,
  permanentlyDeleteNodeDefs,
  markNodeDefsWithoutCyclesDeleted,
  updateNodeDefAnalysisCycles,
  insertNodeDefsBatch,
} from '../repository/nodeDefRepository'

// ======= CREATE

export const insertNodeDef = async (
  { user, survey, cycle = Survey.cycleOneKey, nodeDef: nodeDefParam, system = false, addLogs = true },
  client = db
) =>
  client.tx(async (t) => {
    const surveyId = Survey.getId(survey)

    const insertLog = addLogs
      ? ActivityLogRepository.insert(user, surveyId, ActivityLog.type.nodeDefCreate, nodeDefParam, system, t)
      : null

    const [nodeDef, nodeDefsParentUpdated] = await t.batch([
      NodeDefRepository.insertNodeDef(surveyId, nodeDefParam, t),
      NodeDefLayoutManager.updateParentLayout({ surveyId, nodeDef: nodeDefParam, cyclesAdded: [cycle] }, t),
      markSurveyDraft(surveyId, t),
      insertLog,
    ])

    // TODO move it into NodeDefLayoutManager.updateParentLayout
    if (NodeDef.isEntity(nodeDef) && NodeDefLayout.isRenderForm(cycle)(nodeDef)) {
      const surveyUpdated = Survey.assocNodeDefs({
        nodeDefs: { ...Survey.getNodeDefs(survey), ...nodeDefsParentUpdated },
      })(survey)
      const nodeDefParentUpdated = Survey.updateNodeDefParentLayout({
        survey: surveyUpdated,
        surveyCycleKey: cycle,
        nodeDef,
      })
      await NodeDefRepository.updateNodeDefProps(
        surveyId,
        NodeDef.getUuid(nodeDefParentUpdated),
        NodeDef.getParentUuid(nodeDefParentUpdated),
        NodeDef.getProps(nodeDefParentUpdated),
        NodeDef.getPropsAdvanced(nodeDef),
        t
      )
    }

    return {
      ...nodeDefsParentUpdated,
      [NodeDef.getUuid(nodeDef)]: nodeDef,
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

    let nodeDefsUpdated = updatingCycles
      ? await NodeDefLayoutManager.updateNodeDefLayoutOnCyclesUpdate(
          {
            surveyId,
            nodeDefUuid,
            cycles: props[NodeDef.propKeys.cycles],
          },
          t
        )
      : {}

    let nodeDefsToUpdate = {} // node defs with changes to be stored in the db

    if (NodeDefLayout.keys.layout in props) {
      let surveyUpdated = Survey.assocNodeDefs({ nodeDefs: { ...Survey.getNodeDefs(survey), ...nodeDefsUpdated } })(
        survey
      )
      const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
      const layoutToUpdate = props[NodeDefLayout.keys.layout]
      const layoutEntries = Object.entries(layoutToUpdate)

      layoutEntries.forEach(([surveyCycleKey, layoutCycle]) => {
        Object.entries(layoutCycle).forEach(([key, value]) => {
          nodeDefsToUpdate = {
            ...nodeDefsToUpdate,
            ...Survey.updateNodeDefLayoutProp({ surveyCycleKey, nodeDef, key, value })(surveyUpdated),
          }
          nodeDefsUpdated = {
            ...nodeDefsUpdated,
            ...nodeDefsToUpdate,
          }
          surveyUpdated = Survey.assocNodeDefs({
            nodeDefs: { ...Survey.getNodeDefs(surveyUpdated), ...nodeDefsUpdated },
          })(surveyUpdated)
        })
      })
    }

    const logContent = {
      uuid: nodeDefUuid,
      ...(R.isEmpty(props) ? {} : { props }),
      ...(R.isEmpty(propsAdvanced) ? {} : { propsAdvanced }),
    }

    const [nodeDef] = await t.batch([
      NodeDefRepository.updateNodeDefProps(surveyId, nodeDefUuid, parentUuid, props, propsAdvanced, t),
      ...Object.values(nodeDefsToUpdate).map((nodeDefToUpdate) =>
        NodeDefRepository.updateNodeDefProps(
          surveyId,
          nodeDefToUpdate.uuid,
          nodeDefToUpdate.parentUuid,
          nodeDefToUpdate.props,
          nodeDefToUpdate.propsAdvanced,
          t
        )
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

export const markNodeDefDeleted = async ({ user, surveyId, cycle, nodeDefUuid }, client = db) =>
  client.tx(async (t) => {
    const nodeDef = await NodeDefRepository.markNodeDefDeleted(surveyId, nodeDefUuid, t)

    const logContent = { uuid: nodeDefUuid, name: NodeDef.getName(nodeDef) }

    const [nodeDefsUpdated] = await Promise.all([
      NodeDefLayoutManager.updateParentLayout({ surveyId, nodeDef, cyclesDeleted: [cycle] }, t),
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.nodeDefMarkDeleted, logContent, false, t),
    ])

    return {
      ...nodeDefsUpdated,
      [NodeDef.getUuid(nodeDef)]: nodeDef,
    }
  })
