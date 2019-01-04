const sqlTypes = {
  uuid: 'UUID',
  varchar: 'VARCHAR',
  integer: 'INTEGER',
  decimal: `DECIMAL(${16 + 6}, 6)`,
  date: 'DATE',
  time: 'TIME WITHOUT TIME ZONE',
  point: 'geometry(Point)',
}

module.exports = sqlTypes