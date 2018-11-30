const db = require('../db/db')

const nodeDefRepository = require('./nodeDefRepository')

const {markSurveyDraft} = require('../survey/surveySchemaRepositoryUtils')

const fetchNodeDefSurveyId = async (nodeDefUuid) =>
  await nodeDefRepository.fetchNodeDefSurveyId(nodeDefUuid)

const createNodeDef = async (surveyId, parentUuid, uuid, type, props) =>
  await db.tx(async t => {
    const nodeDef = await nodeDefRepository.createNodeDef(surveyId, parentUuid, uuid, type, props, t)

    await markSurveyDraft(surveyId, t)

    return nodeDef
  })

const updateNodeDefProp = async (nodeDefUuid, key, value, advanced = false) =>
  await db.tx(async t => {
    const nodeDef = await nodeDefRepository.updateNodeDefProp(nodeDefUuid, key, value, advanced, t)

    await markSurveyDraft(nodeDef.surveyId, t)

    return nodeDef
  })

const markNodeDefDeleted = async (nodeDefUuid) =>
  await db.tx(async t => {
    const nodeDef = await nodeDefRepository.markNodeDefDeleted(nodeDefUuid, t)

    await markSurveyDraft(nodeDef.surveyId, t)

    return nodeDef
  })

module.exports = {
  fetchNodeDefSurveyId,
  createNodeDef,
  updateNodeDefProp,
  markNodeDefDeleted,
}