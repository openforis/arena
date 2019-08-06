const R = require('ramda')
const db = require('../../../db/db')

const NodeDef = require('../../../../common/survey/nodeDef')
const SurveyUtils = require('../../../../common/survey/surveyUtils')

const NodeDefRepository = require('../repository/nodeDefRepository')

const { markSurveyDraft } = require('../../survey/repository/surveySchemaRepositoryUtils')

const ActivityLog = require('../../activityLog/activityLogger')

// ======= CREATE

const insertNodeDef = async (user, surveyId, nodeDefParam, client = db) =>
  await client.tx(async t => {
    const nodeDef = await NodeDefRepository.insertNodeDef(surveyId, nodeDefParam, t)

    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.nodeDefCreate, nodeDefParam, t)

    return nodeDef
  })

// ======= READ

const fetchNodeDefsBySurveyId = async (surveyId, draft = false, advanced = false, validate = false, client = db) => {
  const nodeDefsDB = await NodeDefRepository.fetchNodeDefsBySurveyId(surveyId, draft, advanced, client)

  return R.reduce(
    (acc, nodeDef) => {
      // remove draft and unpublished nodeDef
      if (draft || NodeDef.isPublished(nodeDef)) {
        acc[NodeDef.getUuid(nodeDef)] = nodeDef
      }

      return acc
    },
    {},
    nodeDefsDB
  )
}

// ======= UPDATE

const updateNodeDefProps = async (user, surveyId, nodeDefUuid, props, propsAdvanced = {}, client = db) =>
  await client.tx(async t => {
    const nodeDef = await NodeDefRepository.updateNodeDefProps(surveyId, nodeDefUuid, props, propsAdvanced, t)

    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.nodeDefUpdate, { nodeDefUuid, props, propsAdvanced }, t)

    return nodeDef
  })

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
  publishNodeDefsProps: NodeDefRepository.publishNodeDefsProps,

  //DELETE
  markNodeDefDeleted,
  permanentlyDeleteNodeDefs: NodeDefRepository.permanentlyDeleteNodeDefs,
  deleteNodeDefsLabels: NodeDefRepository.deleteNodeDefsLabels,
  deleteNodeDefsDescriptions: NodeDefRepository.deleteNodeDefsDescriptions,
}