const db = require('../db/db')

const nodeDefRepository = require('./nodeDefRepository')

const {markSurveyDraft} = require('../survey/surveySchemaRepositoryUtils')

const createNodeDef = async (surveyId, parentUuid, uuid, type, props) =>
  await db.tx(async t => {
    const nodeDef = await nodeDefRepository.createNodeDef(surveyId, parentUuid, uuid, type, props, t)

    await markSurveyDraft(surveyId, t)

    return nodeDef
  })

const updateNodeDefProp = async (surveyId, nodeDefUuid, key, value, advanced = false) =>
  await db.tx(async t => {
    const nodeDef = await nodeDefRepository.updateNodeDefProp(surveyId, nodeDefUuid, key, value, advanced, t)

    await markSurveyDraft(surveyId, t)

    return nodeDef
  })

const markNodeDefDeleted = async (surveyId, nodeDefUuid) =>
  await db.tx(async t => {
    const nodeDef = await nodeDefRepository.markNodeDefDeleted(surveyId, nodeDefUuid, t)

    await markSurveyDraft(surveyId, t)

    return nodeDef
  })

module.exports = {
  createNodeDef,
  updateNodeDefProp,
  markNodeDefDeleted,
}