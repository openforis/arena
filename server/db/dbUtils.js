const R = require('ramda')
const pgp = require('pg-promise')()

const selectDate = (field, fieldAlias = null) =>
  `to_char(${field},'YYYY-MM-DD"T"HH24:MI:ssZ') as ${fieldAlias ? fieldAlias : field}`

const now = `timezone('UTC', now())`

const insertAllQuery = (schema, table, cols, itemsValues) => {
  const columnSet = new pgp.helpers.ColumnSet(cols, { table: { schema, table } })

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
 * @param idCol Name of the identifier column (used to build the WHERE condition) or pgromise helpers.ColumnConfig object
 * @param updateCols Array of column names or pgromise helpers.ColumnConfig objects that describe the columns to update
 * @param itemsValues List of array of values to use in the update.
 *        The first value in every array of values must be the value of the identifier column
 * @returns Generated query string
 */
const updateAllQuery = (schema, table, idCol, updateCols, itemsValues) => {
  const getColName = col => R.propOr(col, 'name', col)

  const idColName = getColName(idCol)
  const idColCast = R.propOr('text', 'cast', idCol)

  const cols = [`?${idColName}`, ...updateCols]

  const columnSet = new pgp.helpers.ColumnSet(cols, { table: { schema, table } })

  const valuesIndexedByCol = itemsValues.map(itemValues => {
    const item = {}
    //id column is always the first among item values
    item[idColName] = itemValues[0]
    for (let i = 0; i < updateCols.length; i++) {
      const updateCol = updateCols[i]
      item[getColName(updateCol)] = itemValues[i + 1]
    }
    return item
  })

  return pgp.helpers.update(valuesIndexedByCol, columnSet) + ` WHERE v.${idColName}::${idColCast} = t.${idColName}::${idColCast}`
}

/**
 * Combines draft and published props
 */
const getPropsCombined = (draft, columnPrefix = '', alias = 'props') =>
  draft
    ? `${columnPrefix}props || ${columnPrefix}props_draft${alias ? ` AS ${alias}` : ''}`
    : `${columnPrefix}props${alias ? ` AS ${alias}` : ''}`

/**
 * Combines a draft and a published column prop, if needed
 */
const getPropColCombined = (propName, draft, columnPrefix = '', asText = true) =>
  `(${columnPrefix}props${draft ? ` || ${columnPrefix}props_draft` : ''})${asText ? '->>' : '->'}'${propName}'`

/**
 * Generates a filter condition (LIKE) with a named parameter.
 * E.g. "lower(col) LIKE $/searchValue/ where "col" is a json prop column
 */
const getPropFilterCondition = (propName, draft, columnPrefix = '') =>
  `lower(${getPropColCombined(propName, draft, columnPrefix)}) LIKE $/searchValue/`

module.exports = {
  selectDate,
  now,
  insertAllQuery,
  updateAllQuery,

  getPropsCombined,
  //props column
  getPropColCombined,
  getPropFilterCondition
}