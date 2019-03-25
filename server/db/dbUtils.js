const pgp = require('pg-promise')()

const selectDate = (field, fieldAlias = null) =>
  `to_char(${field},'YYYY-MM-DD"T"HH24:MI:ssZ') as ${fieldAlias ? fieldAlias : field}`

const now = `timezone('UTC', now())`

const insertAllQuery = (schema, table, cols, values) => {
  const columnSet = pgp.helpers.ColumnSet(cols, { table: { schema, table } })
  return pgp.helpers.insert(values, columnSet)
}

module.exports = {
  selectDate,
  now,
  insertAllQuery

}