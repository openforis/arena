const db = require('@server/db/db')

const { getSurveyDBSchema } = require('../survey/repository/surveySchemaRepositoryUtils')

const User = require('@core/user/user')

const type = {
  //survey
  surveyCreate: 'surveyCreate',
  surveyPropUpdate: 'surveyPropUpdate',
  surveyPublish: 'surveyPublish',
  surveyCollectImport: 'surveyCollectImport',

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
  categoryImport: 'categoryImport',

  //taxonomy
  taxonomyCreate: 'taxonomyCreate',
  taxonomyPropUpdate: 'taxonomyPropUpdate',
  taxonomyDelete: 'taxonomyDelete',
  taxonomyTaxaDelete: 'taxonomyTaxaDelete',
  taxonomyTaxaImport: 'taxonomyTaxaImport',
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
  userUpdate: 'userUpdate',
  userRemove: 'userRemove',

  // analysis
  processingChainCreate: 'processingChainCreate',
  processingChainPropUpdate: 'processingChainPropUpdate',
  processingChainDelete: 'processingChainDelete',
}

const keys = {
  type: 'type',
  content: 'content',
  system: 'system',
}

const newActivity = (type, content, system = false) => ({
  [keys.type]: type,
  [keys.content]: content,
  [keys.system]: system,
})

const log = async (user, surveyId, type, content, system, client) =>
  client.none(`
    INSERT INTO ${getSurveyDBSchema(surveyId)}.activity_log (type, user_uuid, content, system)
    VALUES ($1, $2, $3::jsonb, $4)`,
    [type, User.getUuid(user), content, system])

const logMany = async (user, surveyId, activities, client) =>
  await client.batch([
    activities.map(activity => log(user, surveyId, activity[keys.type], activity[keys.content], activity[keys.system], client))
  ])

const fetchLogs = async (surveyId, client = db) =>
  await client.any(`SELECT * FROM ${getSurveyDBSchema(surveyId)}.activity_log`)

module.exports = {
  type,
  keys,

  // CREATE
  newActivity,
  log,
  logMany,

  // READ
  fetchLogs
}
