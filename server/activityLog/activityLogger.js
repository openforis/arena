const {getSurveyDBSchema} = require('../../server/survey/surveySchemaRepositoryUtils')

const activityType = {
  survey: {
    create: 'surveyCreate',
    propUpdate: 'surveyPropUpdate',
  },
  nodeDef: {
    create: 'nodeDefCreate',
    update: 'nodeDefUpdate',
    markDeleted: 'nodeDefMarkDeleted',
  },
  category: {
    insert: 'categoryInsert',
    levelInsert: 'categoryLevelInsert',
    itemInsert: 'categoryItemInsert',
    propUpdate: 'categoryPropUpdate',
    levelPropUpdate: 'categoryLevelPropUpdate',
    itemPropUpdate: 'categoryItemPropUpdate',
    delete: 'categoryDelete',
    levelDelete: 'categoryLevelDelete',
    itemDelete: 'categoryItemDelete',
  },
  taxonomy: {
    create: 'taxonomyCreate',
    propUpdate: 'taxonomyPropUpdate',
    delete: 'taxonomyDelete',
  },
  record: {
    nodePersist: 'nodePersist',
    delete: 'recordDelete',
    nodeDelete: 'nodeDelete',
  },
}

const logActivity = async (user, surveyId, type, params, client) =>
  await client.none(`
    INSERT INTO ${getSurveyDBSchema(surveyId)}.activity_log (type, user_email, params)
    VALUES ($1, $2, $3::jsonb)`,
    [type, user.email, params])

module.exports = {
  logActivity,
  activityType,
}
