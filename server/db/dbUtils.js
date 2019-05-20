const pgp = require('pg-promise')()

const selectDate = (field, fieldAlias = null) =>
  `to_char(${field},'YYYY-MM-DD"T"HH24:MI:ssZ') as ${fieldAlias ? fieldAlias : field}`

const now = `timezone('UTC', now())`

const insertAllQuery = (schema, table, cols, itemsValues) => {
  const columnSet = pgp.helpers.ColumnSet(cols, { table: { schema, table } })

  const valuesIndexedByCol = itemsValues.map(itemValues => {
    const item = {}
    for (let i = 0; i < cols.length; i++) {
      item[cols[i]] = itemValues[i]
    }
    return item
  })
  return pgp.helpers.insert(valuesIndexedByCol, columnSet)
}

/**
 * Combines a draft and a published column prop, if needed
 */
const getPropColCombined = (propName, draft, columnPrefix = '') =>
  draft
    ? `(${columnPrefix}props || ${columnPrefix}props_draft)->>'${propName}'`
    : `${columnPrefix}props->>'${propName}'`

/**
 * Generates a filter condition like "lower(col) LIKE 'searchValue' where "col" is a json prop column
 */
const getPropFilterCondition = (propName, searchValue, draft, columnPrefix = '') =>
  searchValue
    ? `lower(${getPropColCombined(propName, draft, columnPrefix)}) LIKE '${searchValue}'`
    : ''

module.exports = {
  selectDate,
  now,
  insertAllQuery,

  //props column
  getPropColCombined,
  getPropFilterCondition
}