import * as R from 'ramda'
import { db } from '@server/db/db'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as ObjectUtils from '@core/objectUtils'
import { uuidv4 } from '@core/uuid'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as NodeDefRepository from '../repository/nodeDefRepository'
import { markSurveyDraft } from '../../survey/repository/surveySchemaRepositoryUtils'

// ======= CREATE

export const insertNodeDef = async (user, surveyId, nodeDefParam, system = false, client = db) =>
  await client.tx(async t => {
    const [nodeDef] = await Promise.all([
      NodeDefRepository.insertNodeDef(surveyId, nodeDefParam, t),
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.nodeDefCreate, nodeDefParam, system, t),
    ])
    return nodeDef
  })

// ======= READ

export const fetchNodeDefsBySurveyId = async (
  surveyId,
  cycle = null,
  draft = false,
  advanced = false,
  includeDeleted = false,
  client = db,
) => {
  const nodeDefsDb = await NodeDefRepository.fetchNodeDefsBySurveyId(
    surveyId,
    cycle,
    draft,
    advanced,
    includeDeleted,
    client,
  )
  return ObjectUtils.toUuidIndexedObj(nodeDefsDb)
}

export const fetchNodeDefByUuid = NodeDefRepository.fetchNodeDefByUuid

// ======= UPDATE

const _updateNodeDefOnCyclesUpdate = async (surveyId, nodeDefUuid, cycles, client) => {
  const nodeDef = await NodeDefRepository.fetchNodeDefByUuid(surveyId, nodeDefUuid, true, false, client)

  const cyclesPrev = NodeDef.getCycles(nodeDef)
  const cyclesAdded = R.difference(cycles, cyclesPrev)
  const cyclesDeleted = R.difference(cyclesPrev, cycles)
  const add = !R.isEmpty(cyclesAdded)

  // Update nodeDef cycles layout
  if (add) {
    for (let i = 0; i < cycles.length; i++) {
      const cycle = cycles[i]
      const cyclePrev = cycles[i - 1]
      // If cycle is new, update layout
      if (R.includes(cycle, cyclesAdded)) {
        if (cyclePrev) {
          // If cycle prev exists, copy layout from previous cycle
          await NodeDefRepository.copyNodeDefsCyclesLayout(surveyId, nodeDefUuid, cyclePrev, [cycle], client)
        } else {
          // Otherwise set the default layout
          const props = {
            [NodeDefLayout.keys.layout]: R.pipe(
              NodeDefLayout.getLayout,
              R.mergeLeft(
                // TODO use NodeDefLayout default props layout
                NodeDef.isEntity(nodeDef)
                  ? NodeDefLayout.newLayout(cycle, NodeDefLayout.renderType.form, uuidv4())
                  : NodeDefLayout.newLayout(cycle, NodeDefLayout.renderType.checkbox),
              ),
            )(nodeDef),
          }
          await NodeDefRepository.updateNodeDefProps(surveyId, nodeDefUuid, props, {}, client)
        }
      }
    }
  } else {
    await NodeDefRepository.deleteNodeDefsCyclesLayout(surveyId, nodeDefUuid, cyclesDeleted, client)
  }

  if (NodeDef.isEntity(nodeDef)) {
    // Update nodeDef descendants cycles
    const cyclesUpdate = add ? cyclesAdded : cyclesDeleted
    return await NodeDefRepository.updateNodeDefDescendantsCycles(surveyId, nodeDefUuid, cyclesUpdate, add, client)
  }

  return []
}

export const updateNodeDefProps = async (
  user,
  surveyId,
  nodeDefUuid,
  props,
  propsAdvanced = {},
  system = false,
  client = db,
) =>
  await client.tx(async t => {
    // Update descendants cycle when updating entity cycle
    const nodeDefsUpdated =
      NodeDef.propKeys.cycles in props
        ? await _updateNodeDefOnCyclesUpdate(surveyId, nodeDefUuid, props[NodeDef.propKeys.cycles], t)
        : []

    const logContent = {
      uuid: nodeDefUuid,
      ...(R.isEmpty(props) ? {} : { props }),
      ...(R.isEmpty(propsAdvanced) ? {} : { propsAdvanced }),
    }

    const [nodeDef] = await Promise.all([
      NodeDefRepository.updateNodeDefProps(surveyId, nodeDefUuid, props, propsAdvanced, t),
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.nodeDefUpdate, logContent, system, t),
    ])

    return {
      [nodeDefUuid]: nodeDef,
      ...ObjectUtils.toUuidIndexedObj(nodeDefsUpdated),
    }
  })

export const addNodeDefsCycles = NodeDefRepository.addNodeDefsCycles

export const deleteNodeDefsCycles = NodeDefRepository.deleteNodeDefsCycles

export const publishNodeDefsProps = async (surveyId, langsDeleted, client = db) => {
  await NodeDefRepository.publishNodeDefsProps(surveyId, client)

  for (const langDeleted of langsDeleted) {
    await NodeDefRepository.deleteNodeDefsLabels(surveyId, langDeleted, client)
    await NodeDefRepository.deleteNodeDefsDescriptions(surveyId, langDeleted, client)
  }

  await NodeDefRepository.deleteNodeDefsValidationMessageLabels(surveyId, langsDeleted, client)
}

// ======= DELETE

export const markNodeDefDeleted = async (user, surveyId, nodeDefUuid) =>
  await db.tx(async t => {
    const nodeDef = await NodeDefRepository.markNodeDefDeleted(surveyId, nodeDefUuid, t)

    const logContent = { uuid: nodeDefUuid, name: NodeDef.getName(nodeDef) }

    await Promise.all([
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.nodeDefMarkDeleted, logContent, false, t),
    ])

    return nodeDef
  })

export const permanentlyDeleteNodeDefs = NodeDefRepository.permanentlyDeleteNodeDefs
export const markNodeDefsWithoutCyclesDeleted = NodeDefRepository.markNodeDefsWithoutCyclesDeleted
