const R = require('ramda')

const DataSchema = require('../schemaRdb/dataSchema')

const runSelect = async (surveyId, tableName, cols, offset, limit, filter = '', client) => {
  const schemaName = DataSchema.getName(surveyId)

  return await client.any(`
    SELECT ${cols.join(', ')} 
    FROM ${schemaName}.${tableName}
    ${R.isEmpty(filter) ? '' : `WHERE ${filter}`}
    LIMIT ${limit}
    OFFSET ${offset}
    `,
    []
  )
}

const runCount = async (surveyId, tableName, filter = '', client) => {
  const schemaName = DataSchema.getName(surveyId)

  return await client.one(`
    SELECT count(*) 
    FROM ${schemaName}.${tableName}
    ${R.isEmpty(filter) ? '' : `WHERE ${filter}`}
  `)
}

module.exports = {
  runSelect,
  runCount,
}