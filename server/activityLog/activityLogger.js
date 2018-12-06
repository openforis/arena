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
    taxonInsert: 'taxonInsert',
    delete: 'taxonomyDelete',
  },
  record: {
    create: 'recordCreate',
    delete: 'recordDelete',
    nodeCreate: 'nodeCreate',
    nodeUpdateValue: 'nodeUpdateValue',
    nodeDelete: 'nodeDelete',
  },
}

const logActivity = async (user, surveyId, type, params, client) =>
  client.none(`
    INSERT INTO ${getSurveyDBSchema(surveyId)}.activity_log (type, user_email, params)
    VALUES ($1, $2, $3::jsonb)`,
    [type, user.email, params])

const logActivities = async (user, surveyId, activities, client) =>
  await client.batch([
    activities.map(activity => logActivity(user, surveyId, activity.type, activity.params, client))
  ])

module.exports = {
  logActivity,
  logActivities,
  activityType,
}
