import type { Readable, Transform } from 'node:stream'

import * as A from '@core/arena'
import pgPromise from 'pg-promise'
import _QueryStream from 'pg-query-stream'

import { Objects, Strings } from '@openforis/arena-core'

import * as NumberUtils from '@core/numberUtils'
import * as StringUtils from '@core/stringUtils'

import { db, DbClient } from '@server/db/db'

const pgp = pgPromise()

// column name (prefixed with '?' if it's only a condition column) or pg-promise column config
export type ColumnSetColumn = string | pgPromise.IColumnConfig<any>

type StreamProcessor = (stream: Readable) => Promise<unknown>

export const QueryStream = _QueryStream

export const stream = async ({
  queryStream,
  client = db,
  transformer = null,
  processor = null,
}: {
  queryStream: _QueryStream
  client?: DbClient
  transformer?: Transform | null
  processor?: StreamProcessor | null
}): Promise<void> =>
  new Promise<void>((resolve, reject) => {
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
        processor?.(transformedStream as Readable)
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

export const fetchQueryAsStream = async ({
  query,
  processor,
  client = db,
  transformer = null,
}: {
  query: string
  processor: StreamProcessor
  client?: DbClient
  transformer?: Transform | null
}): Promise<void> => {
  const queryStream = new QueryStream(query)
  return stream({ queryStream, client, transformer, processor })
}

export const selectTablesAndViewsStartingWithPrefixes = (
  { schema, prefixes }: { schema: string; prefixes: string[] },
  client: DbClient = db
): Promise<{ table_name: string; table_type: string }[]> => {
  const tableNameConditions = prefixes.map((prefix) => `table_name LIKE '${prefix}%'`).join(' OR ')
  return client.query(
    `SELECT table_name, table_type
    FROM information_schema.tables
    WHERE table_schema = $1 AND (${tableNameConditions})`,
    [schema]
  )
}

export const selectDate = (field: string, fieldAlias: string | null = null): string =>
  `to_char(${field},'YYYY-MM-DD"T"HH24:MI:ss.MS"Z"') AS ${fieldAlias || field}`

export const now = "timezone('UTC', now())"

export const geometryPointColumnAsText = ({
  qualifiedColName,
  alias = null,
}: {
  qualifiedColName: string
  alias?: string | null
}): string => {
  const srsIdValue = `ST_SRID(${qualifiedColName})`
  const xValue = `ST_X(${qualifiedColName})`
  const yValue = `ST_Y(${qualifiedColName})`
  const suffix = alias ? ` AS ${alias}` : ''
  return `'SRID=EPSG:' || ${srsIdValue} || ';POINT(' || ${xValue} || ' ' || ${yValue} || ')'${suffix}`
}

export const insertAllQueryBatch = (
  schema: string,
  table: string,
  cols: string[],
  valuesByColumnName: Record<string, unknown>[],
  fillValuesWithNulls = false
): string => {
  const columnSet = createColumnSet({ schema, table, columns: cols })

  if (fillValuesWithNulls) {
    // fill values with nulls to prevent missing values runtime error
    for (const valuesByColNameItem of valuesByColumnName) {
      for (const col of cols) {
        if (valuesByColNameItem[col] === undefined) {
          valuesByColNameItem[col] = null
        }
      }
    }
  }
  return pgp.helpers.insert(valuesByColumnName, columnSet)
}

export const insertAllQuery = (schema: string, table: string, cols: string[], itemsValues: unknown[][]): string => {
  const valuesIndexedByCol = itemsValues.map((itemValues) => {
    const item: Record<string, unknown> = {}
    for (const [i, element] of cols.entries()) {
      item[element] = itemValues[i]
    }
    return item
  })

  return insertAllQueryBatch(schema, table, cols, valuesIndexedByCol)
}

// multi-items update query; idCol (name or pg-promise column config) is used in the WHERE condition
// and its value must be the first one in every array of item values
export const updateAllQuery = (
  schema: string,
  table: string,
  idCol: ColumnSetColumn,
  updateCols: ColumnSetColumn[],
  itemsValues: unknown[][]
): string => {
  const getColumnName = (col: ColumnSetColumn): string => A.propOr(col, 'name', col)

  const idColumnName = getColumnName(idCol)
  const idColCast = A.propOr('text', 'cast', idCol)

  const cols = [`?${idColumnName}`, ...updateCols]

  const columnSet = createColumnSet({ schema, table, columns: cols })

  const valuesIndexedByCol = itemsValues.map((itemValues) => {
    const item: Record<string, unknown> = {}
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

export const getPropsPublishedCondition = ({
  draft,
  tableAlias = null,
}: {
  draft: boolean
  tableAlias?: string | null
}): string => {
  const prefix = tableAlias ? `${tableAlias}.` : ''
  return draft ? '' : `${prefix}props::text <> '{}'::text`
}

// props column combining draft and published props (if draft)
export const getPropsCombined = (draft: boolean, tableAlias = '', alias: string | null = 'props'): string => {
  const columnPrefix = tableAlias ? Strings.appendIfMissing('.')(tableAlias) : ''
  const aliasSql = alias ? ` AS ${alias}` : ''
  const propsSql = draft ? `${columnPrefix}props || ${columnPrefix}props_draft` : `${columnPrefix}props`
  return `${propsSql}${aliasSql}`
}
// prop read from the props combining draft and published props (if draft)
export const getPropColCombined = (
  propName: string,
  draft: boolean,
  columnPrefix = '',
  asText = true,
  alias: string | null = null
): string => {
  const aliasSql = alias ? ` AS ${alias}` : ''
  return `(${getPropsCombined(draft, columnPrefix, null)})${asText ? '->>' : '->'}'${propName}'${aliasSql}`
}

// LIKE condition on a prop, with the named parameter searchValue (e.g. lower(col) LIKE $/searchValue/)
export const getPropFilterCondition = (propName: string, draft: boolean, columnPrefix = ''): string =>
  `lower(${getPropColCombined(propName, draft, columnPrefix)}) LIKE $/searchValue/`

export const filterTypes = {
  includes: 'includes',
  startsWith: 'startsWith',
  endsWith: 'endsWith',
} as const

export const prepareParameterForFilter = (
  value: string | number | null | undefined,
  filterType: string = filterTypes.includes
): string | null => {
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

// LIMIT query parameter (it can come from the request) as a positive integer, or null (LIMIT NULL = LIMIT ALL)
export const normalizeLimit = (limit: unknown): number | null => {
  const limitNumber = NumberUtils.toNumber(limit)
  return Number.isInteger(limitNumber) && limitNumber > 0 ? limitNumber : null
}

// OFFSET query parameter (it can come from the request) as a non-negative integer, 0 if not valid
export const normalizeOffset = (offset: unknown): number => {
  const offsetNumber = NumberUtils.toNumber(offset)
  return Number.isInteger(offsetNumber) && offsetNumber > 0 ? offsetNumber : 0
}

export const formatQuery = pgp.as.format

// collects positional query parameters, so that values (e.g. stored names or language codes) are escaped by pg-promise
// instead of being written into the SQL text; add returns the placeholder (e.g. "$2", or "$2:name" with modifier ":name")
export const newQueryParams = (
  initialValues: unknown[] = []
): { values: unknown[]; add: (value: unknown, modifier?: string) => string } => {
  const values = [...initialValues]
  const add = (value: unknown, modifier = ''): string => {
    values.push(value)
    return `$${values.length}${modifier}`
  }
  return { values, add }
}

// options of client.tx: statements modifying data fail (applied to top-level transactions only)
export const txOptionsReadOnly = { mode: new pgp.txMode.TransactionMode({ readOnly: true }) }

// a quoted identifier: inner double quotes are doubled
const quotedIdentifierRegex = /^"(?:[^"]|"")*"$/

export const asName = (name: string): string =>
  quotedIdentifierRegex.test(name) ? name : StringUtils.quoteDouble(name)

export const getPublishedCondition = ({
  draft,
  tableAlias = null,
}: {
  draft: boolean
  tableAlias?: string | null
}): string => {
  if (draft) return ''
  const tableAliasPrefix = tableAlias ? `${tableAlias}.` : ''
  return `${tableAliasPrefix}props::text <> '{}'::text`
}

export const getWhereClause = (...conditions: (string | null | undefined | false)[]): string => {
  const nonEmptyConditions = conditions.filter((cond) => !!cond)
  return nonEmptyConditions.length > 0 ? `WHERE ${nonEmptyConditions.join(' AND ')}` : ''
}

// Disables Postgres parallel query workers for the rest of the current transaction (SET LOCAL is
// transaction-scoped, so this reverts automatically on commit/rollback). Parallel workers request
// dynamic shared memory from /dev/shm, which some deployments cap well below what a worker may
// need (e.g. Docker's default 64MB shm-size), failing with "could not resize shared memory
// segment ... No space left on device". Use this in a transaction expected to run large/complex
// queries where hitting that ceiling is a real risk and losing intra-query parallelism there is an
// acceptable trade-off.
export const disableParallelQueryForTransaction = (client: DbClient): Promise<null> =>
  client.none('SET LOCAL max_parallel_workers_per_gather = 0')

// runs VACUUM on a table (not in a transaction): it removes dead tuples, making their space reusable;
// full rewrites the table giving the space back to the OS (locking it), analyze updates the table statistics too
export const vacuumTable = (
  {
    schema,
    table,
    full = false,
    analyze = false,
  }: { schema: string; table: string; full?: boolean; analyze?: boolean },
  client: DbClient = db
): Promise<null> => {
  const options = [full && 'FULL', analyze && 'ANALYZE'].filter(Boolean)
  const optionsClause = options.length > 0 ? `(${options.join(', ')}) ` : ''
  return client.none(`VACUUM ${optionsClause}$1:name.$2:name`, [schema, table])
}

export const fetchSchemaTablesSize = ({ schema }: { schema: string }, client: DbClient = db): Promise<number> =>
  client.one(
    `SELECT 
		SUM(pg_total_relation_size(pg_catalog.pg_class.oid)) as size
    FROM pg_catalog.pg_class
      JOIN pg_catalog.pg_namespace ON relnamespace = pg_catalog.pg_namespace.oid
    WHERE pg_catalog.pg_namespace.nspname = $1
      AND pg_catalog.pg_class.relkind IN ('r', 'm', 'p')
`,
    [schema],
    (row) => Number(row.size)
  )

export const fetchTableSize = (
  { schema, table }: { schema: string; table: string },
  client: DbClient = db
): Promise<number> =>
  client.one(
    `SELECT pg_relation_size('"'||table_schema||'"."'||table_name||'"') AS size
    FROM information_schema.tables
    WHERE table_schema = $1 AND table_name = $2`,
    [schema, table],
    (row) => Number(row.size)
  )

export const createColumnSet = ({
  pgp: pgpProp = pgp,
  columns,
  schema = null,
  table = null,
}: {
  pgp?: pgPromise.IMain
  columns: ColumnSetColumn[]
  schema?: string | null
  table?: string | null
}): pgPromise.ColumnSet =>
  new pgpProp.helpers.ColumnSet(
    columns.map((col) => {
      if (typeof col === 'string') {
        if (col.startsWith('?')) {
          return col
        }
        return { name: col, prop: col } // workaround to double quote column names
      }
      return col
    }),
    table ? { table: { schema, table } } : undefined
  )

export const createBulkUpdateValues = ({
  columnSet,
  values,
}: {
  columnSet: pgPromise.ColumnSet
  values: Record<string, unknown>[]
}): string => pgp.helpers.values(values, columnSet)

/**
 * Runs the specified queries and returns their results (in the same order).
 * Queries are run in parallel only when the client is the connection pool (or not specified): in a task or a transaction
 * they share the same connection, where queries cannot run concurrently (deprecated by pg, removed in pg@9), so they are
 * run one after the other.
 */
export const runQueries = async (
  client: DbClient | null | undefined,
  queryFns: (() => Promise<any>)[]
): Promise<any[]> => {
  if (!client || client === db) {
    return Promise.all(queryFns.map((queryFn) => queryFn()))
  }
  const results: any[] = []
  for (const queryFn of queryFns) {
    results.push(await queryFn()) // NOSONAR
  }
  return results
}
