const db = require('../db/db')

const nodeDefRepository = require('./nodeDefRepository')

const {markSurveyDraft} = require('../survey/surveySchemaRepositoryUtils')

const {logActivity, activityType} = require('../activityLog/activityLogger')

const createNodeDef = async (user, surveyId, parentUuid, uuid, type, props) =>
  await db.tx(async t => {
    const nodeDef = await nodeDefRepository.createNodeDef(surveyId, parentUuid, uuid, type, props, t)

    await markSurveyDraft(surveyId, t)

    await logActivity(user, surveyId, activityType.nodeDef.create, {parentUuid, uuid, type, props}, t)

    return nodeDef
  })

const updateNodeDefProp = async (user, surveyId, nodeDefUuid, key, value, advanced = false) =>
  await db.tx(async t => {
    const nodeDef = await nodeDefRepository.updateNodeDefProp(surveyId, nodeDefUuid, key, value, advanced, t)

    await markSurveyDraft(surveyId, t)

    await logActivity(user, surveyId, activityType.nodeDef.update, {nodeDefUuid, key, value, advanced}, t)

    return nodeDef
  })

const markNodeDefDeleted = async (user, surveyId, nodeDefUuid) =>
  await db.tx(async t => {
    const nodeDef = await nodeDefRepository.markNodeDefDeleted(surveyId, nodeDefUuid, t)

    await markSurveyDraft(surveyId, t)

    await logActivity(user, surveyId, activityType.nodeDef.markDeleted, {nodeDefUuid}, t)

    return nodeDef
  })

module.exports = {
  createNodeDef,
  updateNodeDefProp,
  markNodeDefDeleted,
}