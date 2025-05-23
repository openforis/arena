import * as R from 'ramda'
import * as pgPromise from 'pg-promise'
import * as _QueryStream from 'pg-query-stream'

import { db } from '@server/db/db'
import { Objects } from '@openforis/arena-core'

const pgp = pgPromise()

export const QueryStream = _QueryStream

export const stream = async ({ queryStream, client = db, transformer = null, processor = null }) =>
  new Promise((resolve, reject) => {
    let streamComplete = false
    let streamProcessed = false
    const onComplete = () => {
      if (streamComplete && (!processor || streamProcessed)) {
        resolve()
      }
    }
    client
      .stream(queryStream, (dbStream) => {
        const transformedStream = transformer ? dbStream.pipe(transformer) : dbStream
        processor?.(transformedStream)
          .then(() => {
            streamProcessed = true
            onComplete()
          })
          .catch((error) => reject(error))
      })
      .then(() => {
        streamComplete = true
        onComplete()
      })
      .catch((error) => reject(error))
  })

export const fetchQueryAsStream = async ({ query, processor, client = db, transformer = null }) => {
  const queryStream = new QueryStream(query)
  return stream({ queryStream, client, transformer, processor })
}

export const selectTablesAndViewsStartingWithPrefixes = async ({ schema, prefixes }, client = db) => {
  const tableNameConditions = prefixes.map((prefix) => `table_name LIKE '${prefix}%'`).join(' OR ')
  return client.query(
    `SELECT table_name, table_type
    FROM information_schema.tables
    WHERE table_schema = $1 AND (${tableNameConditions})`,
    [schema]
  )
}

export const selectDate = (field, fieldAlias = null) =>
  `to_char(${field},'YYYY-MM-DD"T"HH24:MI:ss.MS"Z"') AS ${fieldAlias || field}`

export const now = "timezone('UTC', now())"

export const insertAllQueryBatch = (schema, table, cols, valuesByColumnName, fillValuesWithNulls = false) => {
  const columnSet = new pgp.helpers.ColumnSet(cols, {
    table: { schema, table },
  })
  if (fillValuesWithNulls) {
    // fill values with nulls to prevent missing values runtime error
    valuesByColumnName.forEach((valuesByColNameItem) =>
      cols.reduce((acc, col) => {
        if (acc[col] === undefined) {
          acc[col] = null
        }
        return acc
      }, valuesByColNameItem)
    )
  }
  return pgp.helpers.insert(valuesByColumnName, columnSet)
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
 * @param {!string} schema - The target schema.
 * @param {!string} table - The target table.
 * @param {!string} idCol - Name of the identifier column (used to build the WHERE condition) or pgromise helpers.ColumnConfig object.
 * @param {!Array} updateCols - Array of column names or pgromise helpers.ColumnConfig objects that describe the columns to update.
 * @param {!Array} itemsValues - List of array of values to use in the update. The first value in every array of values must be the value of the identifier column.
 * @returns {string} Generated query string.
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

export const getPropsPublishedCondition = ({ draft, tableAlias = null }) => {
  const prefix = tableAlias ? `${tableAlias}.` : ''
  return draft ? '' : `${prefix}props::text <> '{}'::text`
}

/**
 * Combines draft and published props.
 *
 * @param {!boolean} draft - Whether the item is draft or published.
 * @param {string} columnPrefix - Prefix (table alias) for the column.
 * @param {string} alias - Alias of the result column.
 * @returns {string} - The column with combined props.
 */
export const getPropsCombined = (draft, columnPrefix = '', alias = 'props') =>
  draft
    ? `${columnPrefix}props || ${columnPrefix}props_draft${alias ? ` AS ${alias}` : ''}`
    : `${columnPrefix}props${alias ? ` AS ${alias}` : ''}`

/**
 * Combines a draft and a published column prop, if needed.
 * @param {!string} propName - Property name.
 * @param {!boolean} draft - Whether the item is draft or published.
 * @param {string} columnPrefix - Prefix (table alias) for the column.
 * @param {boolean} asText - Whether the property must be read as text.
 * @param {string} alias - Alias of the result column.
 * @returns {string} - The column with combined props.
 */
export const getPropColCombined = (propName, draft, columnPrefix = '', asText = true, alias = null) =>
  `(${getPropsCombined(draft, columnPrefix, null)})${asText ? '->>' : '->'}'${propName}'${alias ? ` AS ${alias}` : ''}`

/**
 * Generates a filter condition (LIKE) with a named parameter.
 * E.g. "lower(col) LIKE $/searchValue/ where "col" is a json prop column.
 * @param {!string} propName - Property name.
 * @param {!boolean} draft - Whether the item is draft or published.
 * @param {string} columnPrefix - Prefix (table alias) for the column.
 * @returns {string} - The condition.
 */
export const getPropFilterCondition = (propName, draft, columnPrefix = '') =>
  `lower(${getPropColCombined(propName, draft, columnPrefix)}) LIKE $/searchValue/`

export const filterTypes = {
  includes: 'includes',
  startsWith: 'startsWith',
  endsWith: 'endsWith',
}

export const prepareParameterForFilter = (value, filterType = filterTypes.includes) => {
  if (Objects.isEmpty(value)) return null
  switch (filterType) {
    case filterTypes.includes:
      return `%${value}%`
    case filterTypes.startsWith:
      return `%${value}`
    default:
      return `${value}%`
  }
}

export const formatQuery = pgp.as.format

export const getPublishedCondition = ({ draft, tableAlias = null }) => {
  if (draft) return ''
  const tableAliasPrefix = tableAlias ? `${tableAlias}.` : ''
  return `${tableAliasPrefix}props::text <> '{}'::text`
}

export const getWhereClause = (...conditions) => {
  const nonEmptyConditions = conditions.filter((cond) => !!cond)
  return nonEmptyConditions.length > 0 ? `WHERE ${nonEmptyConditions.join(' AND ')}` : ''
}

// USERS (ROLES)
export const createUser = async (name, password, client = db) =>
  client.query(`CREATE USER "${name}" WITH LOGIN PASSWORD '${password}'`)

export const dropUser = async (name, client = db) => await client.query(`DROP USER IF EXISTS "${name}"`)
