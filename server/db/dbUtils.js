import * as R from 'ramda'
import pgPromise from 'pg-promise'
import * as _QueryStream from 'pg-query-stream'

import { db } from '@server/db/db'

const pgp = pgPromise()

export const QueryStream = _QueryStream

export const selectDate = (field, fieldAlias = null) =>
  `to_char(${field},'YYYY-MM-DD"T"HH24:MI:ss.MS"Z"') AS ${fieldAlias || field}`

export const now = "timezone('UTC', now())"

export const insertAllQueryBatch = (schema, table, cols, itemsValues) => {
  const columnSet = new pgp.helpers.ColumnSet(cols, {
    table: { schema, table },
  })
  return pgp.helpers.insert(itemsValues, columnSet)
}

export const insertAllQuery = (schema, table, cols, itemsValues) => {
  const valuesIndexedByCol = itemsValues.map((itemValues) => {
    const item = {}
    for (const [i, element] of cols.entries()) {
      item[element] = itemValues[i]
    }

    return item
  })

  return insertAllQueryBatch(schema, table, cols, valuesIndexedByCol)
}

/**
 * Creates a multi-items update query.
 *
 * @param schema
 * @param table
 * @param idCol - Name of the identifier column (used to build the WHERE condition) or pgromise helpers.ColumnConfig object.
 * @param updateCols - Array of column names or pgromise helpers.ColumnConfig objects that describe the columns to update.
 * @param itemsValues - List of array of values to use in the update.
 *        The first value in every array of values must be the value of the identifier column.
 * @returns Generated query string.
 */
export const updateAllQuery = (schema, table, idCol, updateCols, itemsValues) => {
  const getColumnName = (col) => R.propOr(col, 'name', col)

  const idColumnName = getColumnName(idCol)
  const idColCast = R.propOr('text', 'cast', idCol)

  const cols = [`?${idColumnName}`, ...updateCols]

  const columnSet = new pgp.helpers.ColumnSet(cols, {
    table: { schema, table },
  })

  const valuesIndexedByCol = itemsValues.map((itemValues) => {
    const item = {}
    // Id column is always the first among item values
    item[idColumnName] = itemValues[0]
    for (const [i, updateCol] of updateCols.entries()) {
      item[getColumnName(updateCol)] = itemValues[i + 1]
    }

    return item
  })

  return `${pgp.helpers.update(
    valuesIndexedByCol,
    columnSet
  )} WHERE v.${idColumnName}::${idColCast} = t.${idColumnName}::${idColCast}`
}

/**
 * Combines draft and published props.
 * @param draft
 * @param columnPrefix
 * @param alias
 */
export const getPropsCombined = (draft, columnPrefix = '', alias = 'props') =>
  draft
    ? `${columnPrefix}props || ${columnPrefix}props_draft${alias ? ` AS ${alias}` : ''}`
    : `${columnPrefix}props${alias ? ` AS ${alias}` : ''}`

/**
 * Combines a draft and a published column prop, if needed.
 * @param propName
 * @param draft
 * @param columnPrefix
 * @param asText
 * @param alias
 */
export const getPropColCombined = (propName, draft, columnPrefix = '', asText = true, alias = null) =>
  `(${getPropsCombined(draft, columnPrefix, null)})${asText ? '->>' : '->'}'${propName}'${alias ? ` AS ${alias}` : ''}`

/**
 * Generates a filter condition (LIKE) with a named parameter.
 * E.g. "lower(col) LIKE $/searchValue/ where "col" is a json prop column.
 * @param propName
 * @param draft
 * @param columnPrefix
 */
export const getPropFilterCondition = (propName, draft, columnPrefix = '') =>
  `lower(${getPropColCombined(propName, draft, columnPrefix)}) LIKE $/searchValue/`

export const formatQuery = pgp.as.format

// USERS (ROLES)
export const createUser = async (name, password, client = db) =>
  client.query(`CREATE USER "${name}" WITH LOGIN PASSWORD '${password}'`)

export const dropUser = async (name, client = db) => await client.query(`DROP USER IF EXISTS "${name}"`)
