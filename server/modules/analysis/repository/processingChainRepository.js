const db = require('../../../db/db')
const DbUtils = require('../../../db/dbUtils')

const {
  getSurveyDBSchema,
  dbTransformCallback,
} = require('../../survey/repository/surveySchemaRepositoryUtils')

const selectFields = `uuid, cycle, props, status_exec, ${DbUtils.selectDate('date_created')}, ${DbUtils.selectDate('date_modified')}, ${DbUtils.selectDate('date_executed')}`

const countChainsBySurveyId = async (surveyId, cycle, client = db) =>
  await client.one(`
      SELECT COUNT(*) 
      FROM ${getSurveyDBSchema(surveyId)}.processing_chain
      WHERE cycle = $1
    `,
    [cycle]
  )

const fetchChainsBySurveyId = async (surveyId, cycle, offset = 0, limit = null, client = db) =>
  await client.map(`
    SELECT ${selectFields}
    FROM ${getSurveyDBSchema(surveyId)}.processing_chain
    WHERE cycle = $1
    ORDER BY date_modified DESC
    LIMIT ${limit || 'ALL'}
    OFFSET ${offset}
    `,
    [cycle],
    dbTransformCallback
  )

module.exports = {
  countChainsBySurveyId,
  fetchChainsBySurveyId,
}