import * as R from 'ramda'
import { db } from '@server/db/db'

import * as NodeDef from '@core/survey/nodeDef'
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
  deleteNodeDefsAnalysisUnused,
} from '../repository/nodeDefRepository'

// ======= CREATE

export const insertNodeDef = async (user, surveyId, cycle, nodeDefParam, system = false, client = db) =>
  client.tx(async (t) => {
    const [nodeDef, nodeDefsParentUpdated] = await Promise.all([
      NodeDefRepository.insertNodeDef(surveyId, nodeDefParam, t),
      NodeDefLayoutManager.updateParentLayout({ surveyId, nodeDef: nodeDefParam, cyclesAdded: [cycle] }, t),
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.nodeDefCreate, nodeDefParam, system, t),
    ])
    return {
      ...nodeDefsParentUpdated,
      [NodeDef.getUuid(nodeDef)]: nodeDef,
    }
  })

// ======= READ

export { fetchNodeDefByUuid } from '../repository/nodeDefRepository'

export const fetchNodeDefsBySurveyId = async (
  surveyId,
  cycle = null,
  draft = false,
  advanced = false,
  includeDeleted = false,
  client = db
) => {
  const nodeDefsDb = await NodeDefRepository.fetchNodeDefsBySurveyId(
    surveyId,
    cycle,
    draft,
    advanced,
    includeDeleted,
    client
  )
  return ObjectUtils.toUuidIndexedObj(nodeDefsDb)
}

// ======= UPDATE

export const updateNodeDefProps = async (
  user,
  surveyId,
  nodeDefUuid,
  parentUuid,
  props,
  propsAdvanced = {},
  system = false,
  client = db
) =>
  client.tx(async (t) => {
    const updatingCycles = NodeDef.propKeys.cycles in props

    const nodeDefsUpdated = updatingCycles
      ? await NodeDefLayoutManager.updateNodeDefLayoutOnCyclesUpdate(
          {
            surveyId,
            nodeDefUuid,
            cycles: props[NodeDef.propKeys.cycles],
          },
          t
        )
      : {}

    const logContent = {
      uuid: nodeDefUuid,
      ...(R.isEmpty(props) ? {} : { props }),
      ...(R.isEmpty(propsAdvanced) ? {} : { propsAdvanced }),
    }

    const [nodeDef] = await Promise.all([
      NodeDefRepository.updateNodeDefProps(surveyId, nodeDefUuid, parentUuid, props, propsAdvanced, t),
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

export const markNodeDefDeleted = async (user, surveyId, cycle, nodeDefUuid) =>
  db.tx(async (t) => {
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
