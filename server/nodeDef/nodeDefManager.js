const db = require('../db/db')

const nodeDefRepository = require('./nodeDefRepository')

const {markSurveyDraft} = require('../survey/surveySchemaRepositoryUtils')

const fetchNodeDef = async (nodeDefId, draft) =>
  await nodeDefRepository.fetchNodeDef(nodeDefId, draft)

const createNodeDef = async (surveyId, parentId, uuid, type, props) =>
  await db.tx(async t => {
    const nodeDef = await nodeDefRepository.createNodeDef(surveyId, parentId, uuid, type, props, t)

    await markSurveyDraft(surveyId, t)

    return nodeDef
  })

const updateNodeDefProp = async (nodeDefId, key, value) =>
  await db.tx(async t => {
    const nodeDef = await nodeDefRepository.updateNodeDefProp(nodeDefId, key, value, t)

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
  fetchNodeDef,
  createNodeDef,
  updateNodeDefProp,
  markNodeDefDeleted,
}