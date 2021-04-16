import * as R from 'ramda'
import * as pgPromise from 'pg-promise'
import * as _QueryStream from 'pg-query-stream'

import { db } from '@server/db/db'

const pgp = pgPromise()

export const QueryStream = _QueryStream

export const selectDate = (field, fieldAlias = null) =>
  `to_char(${field},'YYYY-MM-DD"T"HH24:MI:ssZ') as ${fieldAlias || field}`

export const now = "timezone('UTC', now())"

export const cloneTable = ({ source, destination, excludeColumns = [], filterRowsCondition = null }) => {
  const where = filterRowsCondition ? `WHERE ${filterRowsCondition}` : ''
  const insertRowsScript = `INSERT INTO ${destination} OVERRIDING SYSTEM VALUE (SELECT * FROM ${source} ${where}) on conflict do nothing;`

  const setNullValuesScript = excludeColumns.map((col) => `UPDATE ${destination} SET ${col} = DEFAULT`).join(`; `)

  return `${insertRowsScript}; ${setNullValuesScript};`
}

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
 * @param idCol Name of the identifier column (used to build the WHERE condition) or pgromise helpers.ColumnConfig object
 * @param updateCols Array of column names or pgromise helpers.ColumnConfig objects that describe the columns to update
 * @param itemsValues List of array of values to use in the update.
 *        The first value in every array of values must be the value of the identifier column
 * @returns Generated query string
 */
export const updateAllQuery = (schema, table, idCol, updateCols, itemsValues) => {
  const getColName = (col) => R.propOr(col, 'name', col)

  const idColName = getColName(idCol)
  const idColCast = R.propOr('text', 'cast', idCol)

  const cols = [`?${idColName}`, ...updateCols]

  const columnSet = new pgp.helpers.ColumnSet(cols, {
    table: { schema, table },
  })

  const valuesIndexedByCol = itemsValues.map((itemValues) => {
    const item = {}
    // Id column is always the first among item values
    item[idColName] = itemValues[0]
    for (const [i, updateCol] of updateCols.entries()) {
      item[getColName(updateCol)] = itemValues[i + 1]
    }

    return item
  })

  return `${pgp.helpers.update(
    valuesIndexedByCol,
    columnSet
  )} WHERE v.${idColName}::${idColCast} = t.${idColName}::${idColCast}`
}

/**
 * Combines draft and published props
 */
export const getPropsCombined = (draft, columnPrefix = '', alias = 'props') =>
  draft
    ? `${columnPrefix}props || ${columnPrefix}props_draft${alias ? ` AS ${alias}` : ''}`
    : `${columnPrefix}props${alias ? ` AS ${alias}` : ''}`

/**
 * Combines a draft and a published column prop, if needed
 */
export const getPropColCombined = (propName, draft, columnPrefix = '', asText = true) =>
  `(${columnPrefix}props${draft ? ` || ${columnPrefix}props_draft` : ''})${asText ? '->>' : '->'}'${propName}'`

/**
 * Generates a filter condition (LIKE) with a named parameter.
 * E.g. "lower(col) LIKE $/searchValue/ where "col" is a json prop column
 */
export const getPropFilterCondition = (propName, draft, columnPrefix = '') =>
  `lower(${getPropColCombined(propName, draft, columnPrefix)}) LIKE $/searchValue/`

export const formatQuery = pgp.as.format

// USERS (ROLES)
export const createUser = async (name, password, client = db) =>
  client.query(`CREATE USER "${name}" WITH LOGIN PASSWORD '${password}'`)

export const dropUser = async (name, client = db) => await client.query(`DROP USER IF EXISTS "${name}"`)
