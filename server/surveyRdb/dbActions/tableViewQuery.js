const camelize = require('camelize')

const DataSchema = require('../schemaRdb/dataSchema')

const runSelect = async (surveyId, tableName, cols, offset, limit, client) => {
  const schemaName = DataSchema.getName(surveyId)

  return await client.map(`
    SELECT ${cols.join(', ')} 
    FROM ${schemaName}.${tableName}
    LIMIT ${limit}
    OFFSET ${offset}
    `,
    [],
    camelize
  )
}

const runCount = async (surveyId, tableName, client) => {
  const schemaName = DataSchema.getName(surveyId)

  return await client.one(`SELECT count(*) FROM ${schemaName}.${tableName}`)
}

module.exports = {
  runSelect,
  runCount,
}