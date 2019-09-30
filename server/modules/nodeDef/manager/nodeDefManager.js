const db = require('../../../db/db')

const ObjectUtils = require('../../../../common/objectUtils')

const NodeDefRepository = require('../repository/nodeDefRepository')
const { markSurveyDraft } = require('../../survey/repository/surveySchemaRepositoryUtils')

const ActivityLog = require('../../activityLog/activityLogger')

// ======= CREATE

const insertNodeDef = async (user, surveyId, nodeDefParam, client = db) =>
  await client.tx(async t => {
    const [nodeDef] = await Promise.all([
      NodeDefRepository.insertNodeDef(surveyId, nodeDefParam, t),
      markSurveyDraft(surveyId, t),
      ActivityLog.log(user, surveyId, ActivityLog.type.nodeDefCreate, nodeDefParam, t)
    ])
    return nodeDef
  })

// ======= READ

const fetchNodeDefsBySurveyId = async (surveyId, draft = false, advanced = false, includeDeleted = false, client = db) => {
  const nodeDefsDb = await NodeDefRepository.fetchNodeDefsBySurveyId(surveyId, draft, advanced, includeDeleted, client)
  return ObjectUtils.toUuidIndexedObj(nodeDefsDb)
}

// ======= UPDATE

const updateNodeDefProps = async (user, surveyId, nodeDefUuid, props, propsAdvanced = {}, client = db) =>
  await client.tx(async t => {
    const nodeDef = await NodeDefRepository.updateNodeDefProps(surveyId, nodeDefUuid, props, propsAdvanced, t)

    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.nodeDefUpdate, { nodeDefUuid, props, propsAdvanced }, t)

    return nodeDef
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

    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.nodeDefMarkDeleted, { nodeDefUuid }, t)

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
  publishNodeDefsProps,

  //DELETE
  markNodeDefDeleted,
  permanentlyDeleteNodeDefs: NodeDefRepository.permanentlyDeleteNodeDefs,
}