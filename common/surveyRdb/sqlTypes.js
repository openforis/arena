export const sqlTypes = {
  uuid: 'UUID',
  varchar: 'VARCHAR',
  integer: 'BIGINT',
  decimal: `DECIMAL(${16 + 6}, 6)`,
  date: 'DATE',
  time: 'TIME WITHOUT TIME ZONE',
  point: 'geometry(Point)',
}
