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
 * Creates a multi-items update query.
 *
 * @param schema
 * @param table
 * @param idCol Name of the identifier column (used to build the WHERE condition)
 * @param updateCols Array of column names to be updated
 * @param itemsValues List of array of values to use in the update.
 *        The first value in every array of values must be the value of the identifier column
 * @returns Generated query string
 */
const updateAllQuery = (schema, table, idCol, updateCols, itemsValues) => {
  const cols = [`?${idCol}`, ...(updateCols.map(updateCol => `${updateCol}`))]
  const columnSet = pgp.helpers.ColumnSet(cols, { table: { schema, table } })

  const valuesIndexedByCol = itemsValues.map(itemValues => {
    const item = {}
    //id column is always the first among item values
    item[idCol] = itemValues[0]
    for (let i = 0; i < updateCols.length; i++) {
      item[updateCols[i]] = itemValues[i + 1]
    }
    return item
  })
  return pgp.helpers.update(valuesIndexedByCol, columnSet) + ` WHERE v.${idCol}::text = t.${idCol}::text`
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
  updateAllQuery,

  //props column
  getPropColCombined,
  getPropFilterCondition
}