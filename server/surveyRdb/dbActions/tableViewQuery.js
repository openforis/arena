const camelize = require('camelize')

const DataSchema = require('../schemaRdb/dataSchema')

const run = async (surveyId, tableName, cols, offset, limit, client) => {
  const schemaName = DataSchema.getName(surveyId)
  return await client.map(`
    SELECT ${cols.join(', ')} 
    FROM ${schemaName}.${tableName}
    LIMIT ${limit}
    OFFSET ${offset}
    `,
    [],
    camelize)
}

module.exports = {
  run
}