const R = require('ramda')
const db = require('@server/db/db')

const NodeDef = require('@core/survey/nodeDef')
const NodeDefLayout = require('@core/survey/nodeDefLayout')
const ObjectUtils = require('@core/objectUtils')
const { uuidv4 } = require('@core/uuid')

const NodeDefRepository = require('../repository/nodeDefRepository')
const { markSurveyDraft } = require('../../survey/repository/surveySchemaRepositoryUtils')

const ActivityLog = require('@common/activityLog/activityLog')
const ActivityLogRepository = require('@server/modules/activityLog/repository/activityLogRepository')

// ======= CREATE

const insertNodeDef = async (user, surveyId, nodeDefParam, system = false, client = db) =>
  await client.tx(async t => {
    const nodeDefParentUuid = NodeDef.getParentUuid(nodeDefParam)
    const nodeDefParent = nodeDefParentUuid ? await NodeDefRepository.fetchNodeDefByUuid(surveyId, nodeDefParentUuid, true, false, t) : null
    const parentName = NodeDef.getName(nodeDefParent)
    const activityLogContent = { ...nodeDefParam, parentName }

    const [nodeDef] = await Promise.all([
      NodeDefRepository.insertNodeDef(surveyId, nodeDefParam, t),
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.nodeDefCreate, activityLogContent, system, t)
    ])
    return nodeDef
  })

// ======= READ

const fetchNodeDefsBySurveyId = async (surveyId, cycle = null, draft = false, advanced = false, includeDeleted = false, client = db) => {
  const nodeDefsDb = await NodeDefRepository.fetchNodeDefsBySurveyId(surveyId, cycle, draft, advanced, includeDeleted, client)
  return ObjectUtils.toUuidIndexedObj(nodeDefsDb)
}

// ======= UPDATE

const _updateNodeDefOnCyclesUpdate = async (surveyId, nodeDefUuid, cycles, client) => {
  const nodeDef = await NodeDefRepository.fetchNodeDefByUuid(surveyId, nodeDefUuid, true, false, client)

  const cyclesPrev = NodeDef.getCycles(nodeDef)
  const cyclesAdded = R.difference(cycles, cyclesPrev)
  const cyclesDeleted = R.difference(cyclesPrev, cycles)
  const add = !R.isEmpty(cyclesAdded)

  // update nodeDef cycles layout
  if (add) {
    for (let i = 0; i < cycles.length; i++) {
      const cycle = cycles[i]
      const cyclePrev = cycles[i - 1]
      // if cycle is new, update layout
      if (R.includes(cycle, cyclesAdded)) {
        if (cyclePrev) {
          // if cycle prev exists, copy layout from previous cycle
          await NodeDefRepository.copyNodeDefsCyclesLayout(surveyId, nodeDefUuid, cyclePrev, [cycle], client)
        } else {
          // otherwise set the default layout
          const props = {
            [NodeDefLayout.keys.layout]: R.pipe(
              NodeDefLayout.getLayout,
              R.mergeLeft(
                //TODO use NodeDefLayout default props layout
                NodeDef.isEntity(nodeDef)
                  ? NodeDefLayout.newLayout(cycle, NodeDefLayout.renderType.form, uuidv4())
                  : NodeDefLayout.newLayout(cycle, NodeDefLayout.renderType.checkbox)
              )
            )(nodeDef)
          }
          await NodeDefRepository.updateNodeDefProps(surveyId, nodeDefUuid, props, {}, client)
        }
      }
    }
  } else {
    await NodeDefRepository.deleteNodeDefsCyclesLayout(surveyId, nodeDefUuid, cyclesDeleted, client)
  }

  if (NodeDef.isEntity(nodeDef)) {
    // update nodeDef descendants cycles
    const cyclesUpdate = add ? cyclesAdded : cyclesDeleted
    return await NodeDefRepository.updateNodeDefDescendantsCycles(surveyId, nodeDefUuid, cyclesUpdate, add, client)
  }

  return []
}

const updateNodeDefProps = async (user, surveyId, nodeDefUuid, props, propsAdvanced = {}, system = false, client = db) =>
  await client.tx(async t => {
    // update descendants cycle when updating entity cycle
    const nodeDefsUpdated = NodeDef.propKeys.cycles in props
      ? await _updateNodeDefOnCyclesUpdate(surveyId, nodeDefUuid, props[NodeDef.propKeys.cycles], t)
      : []

    const nodeDef = await NodeDefRepository.updateNodeDefProps(surveyId, nodeDefUuid, props, propsAdvanced, t)

    const logContent = {
      uuid: nodeDefUuid,
      ...(R.isEmpty(props) ? {} : { props }),
      ...(R.isEmpty(propsAdvanced) ? {} : { propsAdvanced }),
      keys: Object.keys({ ...props, ...propsAdvanced }),
      name: NodeDef.getName(nodeDef)
    }

    await Promise.all([
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.nodeDefUpdate, logContent, system, t)
    ])

    return {
      [nodeDefUuid]: nodeDef,
      ...ObjectUtils.toUuidIndexedObj(nodeDefsUpdated)
    }
  })

const publishNodeDefsProps = async (surveyId, langsDeleted, client = db) => {
  await NodeDefRepository.publishNodeDefsProps(surveyId, client)

  for (const langDeleted of langsDeleted) {
    await NodeDefRepository.deleteNodeDefsLabels(surveyId, langDeleted, client)
    await NodeDefRepository.deleteNodeDefsDescriptions(surveyId, langDeleted, client)
  }

  await NodeDefRepository.deleteNodeDefsValidationMessageLabels(surveyId, langsDeleted, client)
}

// ======= DELETE

const markNodeDefDeleted = async (user, surveyId, nodeDefUuid) =>
  await db.tx(async t => {
    const nodeDef = await NodeDefRepository.markNodeDefDeleted(surveyId, nodeDefUuid, t)

    const logContent = { uuid: nodeDefUuid, name: NodeDef.getName(nodeDef) }

    await Promise.all([
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.nodeDefMarkDeleted, logContent, false, t)
    ])

    return nodeDef
  })

module.exports = {
  //CREATE
  insertNodeDef,

  //READ
  fetchNodeDefsBySurveyId,
  fetchNodeDefByUuid: NodeDefRepository.fetchNodeDefByUuid,

  //UPDATE
  updateNodeDefProps,
  addNodeDefsCycles: NodeDefRepository.addNodeDefsCycles,
  deleteNodeDefsCycles: NodeDefRepository.deleteNodeDefsCycles,
  publishNodeDefsProps,

  //DELETE
  markNodeDefDeleted,
  permanentlyDeleteNodeDefs: NodeDefRepository.permanentlyDeleteNodeDefs,
  markNodeDefsWithoutCyclesDeleted: NodeDefRepository.markNodeDefsWithoutCyclesDeleted,
}