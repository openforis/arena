const db = require('../../db/db')

const { getSurveyDBSchema } = require('../survey/repository/surveySchemaRepositoryUtils')

const User = require('../../../core/user/user')

const type = {
  //survey
  surveyCreate: 'surveyCreate',
  surveyPropUpdate: 'surveyPropUpdate',
  surveyPublish: 'surveyPublish',

  // nodeDef
  nodeDefCreate: 'nodeDefCreate',
  nodeDefUpdate: 'nodeDefUpdate',
  nodeDefMarkDeleted: 'nodeDefMarkDeleted',

  //category
  categoryInsert: 'categoryInsert',
  categoryPropUpdate: 'categoryPropUpdate',
  categoryDelete: 'categoryDelete',
  categoryLevelInsert: 'categoryLevelInsert',
  categoryLevelPropUpdate: 'categoryLevelPropUpdate',
  categoryLevelDelete: 'categoryLevelDelete',
  categoryLevelsDelete: 'categoryLevelsDelete',
  categoryItemInsert: 'categoryItemInsert',
  categoryItemPropUpdate: 'categoryItemPropUpdate',
  categoryItemDelete: 'categoryItemDelete',

  //taxonomy
  taxonomyCreate: 'taxonomyCreate',
  taxonomyPropUpdate: 'taxonomyPropUpdate',
  taxonomyDelete: 'taxonomyDelete',
  taxonomyTaxaDelete: 'taxonomyTaxaDelete',
  taxonInsert: 'taxonInsert',

  //record
  recordCreate: 'recordCreate',
  recordDelete: 'recordDelete',

  //node
  nodeCreate: 'nodeCreate',
  nodeValueUpdate: 'nodeValueUpdate',
  nodeDelete: 'nodeDelete',

  // user
  userInvite: 'userInvite',
  userInviteAccept: 'userInviteAccept',
  userUpdate: 'userUpdate',
  userRemove: 'userRemove',

  // analysis
  processingChainCreate: 'processingChainCreate',
  processingChainPropUpdate: 'processingChainPropUpdate',
  processingChainDelete: 'processingChainDelete',
}

const keys = {
  type: 'type',
  content: 'content'
}

const newItem = (type, content) => ({
  [keys.type]: type,
  [keys.content]: content
})

const log = async (user, surveyId, type, content, client) =>
  client.none(`
    INSERT INTO ${getSurveyDBSchema(surveyId)}.activity_log (type, user_uuid, content)
    VALUES ($1, $2, $3::jsonb)`,
    [type, User.getUuid(user), content])

const logMany = async (user, surveyId, activities, client) =>
  await client.batch([
    activities.map(activity => log(user, surveyId, activity[keys.type], activity[keys.content], client))
  ])

const fetchLogs = async (surveyId, client = db) =>
  await client.any(`SELECT * FROM ${getSurveyDBSchema(surveyId)}.activity_log`)

module.exports = {
  type,
  keys,

  // CREATE
  newItem,
  log,
  logMany,

  // READ
  fetchLogs
}
