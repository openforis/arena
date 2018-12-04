const {getSurveyDBSchema} = require('../../server/survey/surveySchemaRepositoryUtils')

const logActivity = async (user, surveyId, type, params, client) =>
  await client.none(`
    INSERT INTO ${getSurveyDBSchema(surveyId)}.activity_log (type, user_email, params)
    VALUES ($1, $2, $3::jsonb)`,
    [type, user.email, params])

module.exports = {
  logActivity,
}
