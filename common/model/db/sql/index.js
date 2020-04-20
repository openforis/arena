export const types = {
  uuid: 'UUID',
  varchar: 'VARCHAR',
  bigint: 'BIGINT',
  decimal: `DECIMAL(${16 + 6}, 6)`,
  date: 'DATE',
  time: 'TIME WITHOUT TIME ZONE',
  timeStamp: 'TIMESTAMP',
  geometryPoint: 'geometry(Point)',
}

// Alias
export const createAlias = (name) =>
  name
    .split('_')
    .map((word) => word[0])
    .join('')

export const addAlias = (alias, ...columnNames) => columnNames.map((columnName) => `${alias}.${columnName}`)

// Json
export const jsonAgg = (expression, orderByColumns = []) =>
  `json_agg(${expression}${orderByColumns.length > 0 ? ` ORDER BY ${orderByColumns.join(', ')}` : ''})`
