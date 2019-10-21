import db from '../../db/db';
import { getSurveyDBSchema } from '../survey/repository/surveySchemaRepositoryUtils';
import User from '../../../core/user/user';
import { SurveyId } from '../../../core/survey/_survey/surveyInfo';

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
  userUpdate: 'userUpdate',
  userRemove: 'userRemove',

  // analysis
  processingChainCreate: 'processingChainCreate',
  processingChainPropUpdate: 'processingChainPropUpdate',
  processingChainDelete: 'processingChainDelete',
}

const keys = {
  type: 'type',
  params: 'params'
}

const log = async (user, surveyId: SurveyId, type, params, client) =>
  client.none(`
    INSERT INTO ${getSurveyDBSchema(surveyId)}.activity_log (type, user_uuid, params)
    VALUES ($1, $2, $3::jsonb)`,
    [type, User.getUuid(user), params])

const logMany = async (user, surveyId: SurveyId, activities, client) =>
  await client.batch([
    activities.map(activity => log(user, surveyId, activity.type, activity.params, client))
  ])

const fetchLogs = async (surveyId: SurveyId, client: any = db) =>
  await client.any(`SELECT * FROM ${getSurveyDBSchema(surveyId)}.activity_log`)

export default {
  type,
  keys,

  // CREATE
  log,
  logMany,

  // READ
  fetchLogs
};
