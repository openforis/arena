const pgp = require('pg-promise')()

const selectDate = (field, fieldAlias = null) =>
  `to_char(${field},'YYYY-MM-DD"T"HH24:MI:ssZ') as ${fieldAlias ? fieldAlias : field}`

const now = `timezone('UTC', now())`

const insertAllQuery = (schema, table, cols, itemsValues) => {
  const columnSet = pgp.helpers.ColumnSet(cols, { table: { schema, table } })

  const valuesIndexedByCol = itemsValues.map(itemValues => {
    const item = {}
    for (let i = 0; i< cols.length; i++) {
      item[cols[i]] = itemValues[i]
    }
    return item
  })
  return pgp.helpers.insert(valuesIndexedByCol, columnSet)
}

module.exports = {
  selectDate,
  now,
  insertAllQuery

}