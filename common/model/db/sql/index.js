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

/**
 * Generates an alias from the specified name, splitting it into words
 * and getting the first letter of each word, to make it more or less human readable,
 * followed by a short hash of the name, to make it (almost) unique, but still short.
 *
 * @param {!string} name - The name used to generate the alias.
 * @returns {string} - The generated alias.
 */
export const createAlias = (name) =>
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

export const addAlias = (alias, ...columnNames) => columnNames.map((columnName) => `${alias}.${columnName}`)

// Json
export const jsonAgg = (expression, orderByColumns = []) => {
  const whenExpr = `WHEN count(${expression}) = 0 THEN '[]'`
  const orderBy = orderByColumns.length > 0 ? ` ORDER BY ${orderByColumns.join(', ')}` : ''
  const elseExpr = `ELSE json_agg(${expression}${orderBy})`
  return `CASE ${whenExpr} ${elseExpr} END`
}

export const jsonBuildObject = (...args) => `jsonb_build_object(${args.join(', ')})`
