import * as StringUtils from '@core/stringUtils'

export const types = {
  uuid: 'UUID',
  varchar: 'VARCHAR',
  bigint: 'BIGINT',
  decimal: `DECIMAL`,
  date: 'DATE',
  time: 'TIME WITHOUT TIME ZONE',
  timeStamp: 'TIMESTAMP',
  geometryPoint: 'geometry(Point)',
}

const jsTypeBySqlType = {
  [types.uuid]: 'string',
  [types.varchar]: 'string',
  [types.bigint]: 'number',
  [types.decimal]: 'number',
  [types.date]: 'string', // ISO date string
  [types.time]: 'string', // ISO time string
  [types.timeStamp]: 'string', // ISO timestamp string
  [types.geometryPoint]: 'object', // GeoJSON Point object
}

export const getJsTypeBySqlType = (sqlType: string): string => jsTypeBySqlType[sqlType] || 'unknown'

// short, (almost) unique alias: first letter of each word in the name, followed by a short hash of the name
export const createAlias = (name: string): string =>
  // add '_' prefix to avoid collision with reserved words
  `_${name
    // split in words
    .split('_')
    // get first letters of each word
    .map((word) => word[0])
    .join('')}_${
    // append name hash to avoid collisions
    StringUtils.hashCode(name)
  }`

const quoteIdentifier = (identifier: string): string =>
  // do not quote '*' (used in count(*)) or identifiers starting with '_' (used for aliases), to avoid breaking queries
  identifier === '*' || identifier.startsWith('_') ? identifier : StringUtils.quoteDouble(identifier)

export const addAlias = (alias: string, ...columnNames: string[]): string[] =>
  columnNames.map((columnName) => `${quoteIdentifier(alias)}.${quoteIdentifier(columnName)}`)

// Json
export const jsonAgg = (expression: string, orderByColumns: string[] = []): string => {
  const whenExpr = `WHEN count(${expression}) = 0 THEN '[]'`
  const orderBy = orderByColumns.length > 0 ? ` ORDER BY ${orderByColumns.join(', ')}` : ''
  const elseExpr = `ELSE json_agg(${expression}${orderBy})`
  return `CASE ${whenExpr} ${elseExpr} END`
}

export const jsonBuildObject = (...args: string[]): string => `jsonb_build_object(${args.join(', ')})`
