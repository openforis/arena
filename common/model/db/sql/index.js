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

// Alias
export const createAlias = (name) =>
  // add '_' prefix to avoid collision with reserved words
  `_${name
    .split('_')
    .map((word) => word[0])
    .join('')}`

export const addAlias = (alias, ...columnNames) => columnNames.map((columnName) => `${alias}.${columnName}`)

// Json
export const jsonAgg = (expression, orderByColumns = []) => {
  const whenExpr = `WHEN count(${expression}) = 0 THEN '[]'`
  const orderBy = orderByColumns.length > 0 ? ` ORDER BY ${orderByColumns.join(', ')}` : ''
  const elseExpr = `ELSE json_agg(${expression}${orderBy})`
  return `CASE ${whenExpr} ${elseExpr} END`
}

export const jsonBuildObject = (...args) => `jsonb_build_object(${args.join(', ')})`
