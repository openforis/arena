const R = require('ramda')
const db = require('../db/db')

const SurveyUtils = require('../../common/survey/surveyUtils')
const NodeDef = require('../../common/survey/nodeDef')

const NodeDefRepository = require('./nodeDefRepository')
const NodeDefValidator = require('../nodeDef/nodeDefValidator')

const {markSurveyDraft} = require('../survey/surveySchemaRepositoryUtils')

const ActivityLog = require('../activityLog/activityLogger')

// ======= CREATE

const createNodeDef = async (user, surveyId, parentUuid, uuid, type, props, client = db) =>
  await client.tx(async t => {
    const nodeDef = await NodeDefRepository.createNodeDef(surveyId, parentUuid, uuid, type, props, t)

    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.nodeDefCreate, {parentUuid, uuid, type, props}, t)

    return {
      ...nodeDef,
      validation: await NodeDefValidator.validateNodeDef({}, nodeDef)
    }
  })

const createEntityDef = async (user, surveyId, parentUuid, uuid, props, client = db) =>
  await createNodeDef(user, surveyId, parentUuid, uuid, NodeDef.nodeDefType.entity, props, client)

// ======= READ

const processNodeDefs = async (nodeDefsDb, draft, validate) => {
  const nodeDefsResult = R.pipe(
    R.reduce(
      (acc, nodeDef) => draft
        ? R.append(nodeDef, acc)
        // remove draft and unpublished nodeDef
        : nodeDef.draft && !nodeDef.published
          ? acc
          : R.append(nodeDef, acc),
      [],
    ),
    SurveyUtils.toUuidIndexedObj
  )(nodeDefsDb)

  return validate
    ? await NodeDefValidator.validateNodeDefs(nodeDefsResult)
    : nodeDefsResult
}

const fetchNodeDefsBySurveyId = async (surveyId, draft = false, advanced = false, validate = false, client = db) => {
  const nodeDefsDB = await NodeDefRepository.fetchNodeDefsBySurveyId(surveyId, draft, advanced, client)
  return await processNodeDefs(nodeDefsDB, draft, validate)
}

const fetchNodeDefsByUuid = async (surveyId, nodeDefUuids = [], draft = false, validate = false) => {
  const nodeDefsDB = await NodeDefRepository.fetchNodeDefsByUuid(surveyId, nodeDefUuids, draft, validate)
  return await processNodeDefs(nodeDefsDB, draft, validate)
}

// ======= UPDATE

const updateNodeDefProps = async (user, surveyId, nodeDefUuid, props) =>
  await db.tx(async t => {
    const nodeDef = await NodeDefRepository.updateNodeDefProps(surveyId, nodeDefUuid, props, t)

    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.nodeDefUpdate, {nodeDefUuid, props}, t)

    return nodeDef
  })

// ======= DELETE

const markNodeDefDeleted = async (user, surveyId, nodeDefUuid) =>
  await db.tx(async t => {
    const nodeDef = await NodeDefRepository.markNodeDefDeleted(surveyId, nodeDefUuid, t)

    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.nodeDefMarkDeleted, {nodeDefUuid}, t)

    return nodeDef
  })

module.exports = {
  //CREATE
  createNodeDef,
  createEntityDef,

  //READ
  fetchNodeDefsBySurveyId,
  fetchNodeDefsByUuid,
  fetchNodeDefByUuid: NodeDefRepository.fetchNodeDefByUuid,

  //UPDATE
  updateNodeDefProps,
  publishNodeDefsProps: NodeDefRepository.publishNodeDefsProps,

  //DELETE
  markNodeDefDeleted,
  permanentlyDeleteNodeDefs: NodeDefRepository.permanentlyDeleteNodeDefs,
  deleteNodeDefsLabels: NodeDefRepository.deleteNodeDefsLabels,
  deleteNodeDefsDescriptions: NodeDefRepository.deleteNodeDefsDescriptions,
}