const db = require('../db/db')

const nodeDefRepository = require('./nodeDefRepository')

const {markSurveyDraft} = require('../survey/surveySchemaRepositoryUtils')

const fetchNodeDefSurveyId = async (nodeDefId) =>
  await nodeDefRepository.fetchNodeDefSurveyId(nodeDefId)

const createNodeDef = async (surveyId, parentId, uuid, type, props) =>
  await db.tx(async t => {
    const nodeDef = await nodeDefRepository.createNodeDef(surveyId, parentId, uuid, type, props, t)

    await markSurveyDraft(surveyId, t)

    return nodeDef
  })

const updateNodeDefProp = async (nodeDefId, key, value, advanced = false) =>
  await db.tx(async t => {
    const nodeDef = await nodeDefRepository.updateNodeDefProp(nodeDefId, key, value, advanced, t)

    await markSurveyDraft(nodeDef.surveyId, t)

    return nodeDef
  })

const markNodeDefDeleted = async (nodeDefId) =>
  await db.tx(async t => {
    const nodeDef = await nodeDefRepository.markNodeDefDeleted(nodeDefId, t)

    await markSurveyDraft(nodeDef.surveyId, t)

    return nodeDef
  })

module.exports = {
  fetchNodeDefSurveyId,
  createNodeDef,
  updateNodeDefProp,
  markNodeDefDeleted,
}