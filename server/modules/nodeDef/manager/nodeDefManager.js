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

export {
  addNodeDefsCycles,
  deleteNodeDefsCycles,
  permanentlyDeleteNodeDefs,
  markNodeDefsWithoutCyclesDeleted,
  updateNodeDefAnalysisCycles,
  deleteNodeDefsAnalysisUnused,
} from '../repository/nodeDefRepository'

// ======= CREATE

const nodeDefLayoutHeights = {
  [NodeDef.nodeDefType.coordinate]: 2,
  [NodeDef.nodeDefType.taxon]: 2,
}

const _updateParentLayout = async (user, surveyId, surveyCycleKey, nodeDef, deleted = false, client = db) => {
  if (NodeDef.isRoot(nodeDef) || NodeDef.isVirtual(nodeDef)) return {}

  const nodeDefParent = await NodeDefRepository.fetchNodeDefByUuid(
    surveyId,
    NodeDef.getParentUuid(nodeDef),
    true,
    false,
    client,
  )
  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  const layoutChildren = NodeDefLayout.getLayoutChildren(surveyCycleKey)(nodeDefParent)

  let layoutChildrenUpdated
  if (NodeDefLayout.isRenderTable(surveyCycleKey)(nodeDefParent)) {
    // Add or remove node def from children (render as table)
    layoutChildrenUpdated = R.ifElse(R.always(deleted), R.without([nodeDefUuid]), R.append(nodeDefUuid))(layoutChildren)
  } else if (deleted) {
    // Remove node def from children (render as form)
    layoutChildrenUpdated = R.reject(R.propEq('i', nodeDefUuid), layoutChildren)
  } else {
    // Add new node to the bottom left corner of the form (x = 0, y = max value of every child layout y + h or 0)
    const y = R.reduce((accY, layoutChild) => R.max(accY, layoutChild.y + layoutChild.h), 0, layoutChildren)
    // New node def height depends on its type
    const h = R.propOr(1, NodeDef.getType(nodeDef), nodeDefLayoutHeights)
    layoutChildrenUpdated = R.append({ i: nodeDefUuid, x: 0, y, w: 1, h })(layoutChildren)
  }

  if (!R.equals(layoutChildren, layoutChildrenUpdated)) {
    // Update parent node def layout
    const layoutUpdated = R.pipe(
      NodeDefLayout.getLayout,
      NodeDefLayout.assocLayoutChildren(surveyCycleKey, layoutChildrenUpdated),
    )(nodeDefParent)

    return await updateNodeDefProps(
      user,
      surveyId,
      NodeDef.getUuid(nodeDefParent),
      NodeDef.getParentUuid(nodeDefParent),
      { [NodeDefLayout.keys.layout]: layoutUpdated },
      {},
      true,
      client,
    )
  }

  return {}
}

export const insertNodeDef = async (user, surveyId, surveyCycleKey, nodeDefParam, system = false, client = db) =>
  await client.tx(async t => {
    const [nodeDef, nodeDefsParentUpdated] = await Promise.all([
      NodeDefRepository.insertNodeDef(surveyId, nodeDefParam, t),
      _updateParentLayout(user, surveyId, surveyCycleKey, nodeDefParam, false, t),
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.nodeDefCreate, nodeDefParam, system, t),
    ])
    return {
      ...nodeDefsParentUpdated,
      [NodeDef.getUuid(nodeDef)]: nodeDef,
    }
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
          await NodeDefRepository.updateNodeDefProps(
            surveyId,
            nodeDefUuid,
            NodeDef.getParentUuid(nodeDef),
            props,
            {},
            client,
          )
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
  parentUuid,
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
      NodeDefRepository.updateNodeDefProps(surveyId, nodeDefUuid, parentUuid, props, propsAdvanced, t),
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.nodeDefUpdate, logContent, system, t),
    ])

    return {
      [nodeDefUuid]: nodeDef,
      ...ObjectUtils.toUuidIndexedObj(nodeDefsUpdated),
    }
  })

export const publishNodeDefsProps = async (surveyId, langsDeleted, client = db) => {
  await NodeDefRepository.publishNodeDefsProps(surveyId, client)

  for (const langDeleted of langsDeleted) {
    await NodeDefRepository.deleteNodeDefsLabels(surveyId, langDeleted, client)
    await NodeDefRepository.deleteNodeDefsDescriptions(surveyId, langDeleted, client)
  }

  await NodeDefRepository.deleteNodeDefsValidationMessageLabels(surveyId, langsDeleted, client)
}

// ======= DELETE

export const markNodeDefDeleted = async (user, surveyId, surveyCycleKey, nodeDefUuid) =>
  await db.tx(async t => {
    const nodeDef = await NodeDefRepository.markNodeDefDeleted(surveyId, nodeDefUuid, t)

    const logContent = { uuid: nodeDefUuid, name: NodeDef.getName(nodeDef) }

    const [nodeDefsUpdated] = await Promise.all([
      _updateParentLayout(user, surveyId, surveyCycleKey, nodeDef, true, t),
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.nodeDefMarkDeleted, logContent, false, t),
    ])

    return {
      ...nodeDefsUpdated,
      [NodeDef.getUuid(nodeDef)]: nodeDef,
    }
  })
