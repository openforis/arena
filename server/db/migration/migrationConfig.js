const ProcessUtils = require('@core/processUtils')

const config = {
  driver: 'pg',
  user: ProcessUtils.ENV.pgUser,
  password: ProcessUtils.ENV.pgPassword,
  host: ProcessUtils.ENV.pgHost,
  database: ProcessUtils.ENV.pgDatabase,
  schema: ProcessUtils.ENV.pgSchema,
  ssl: ProcessUtils.ENV.pgSsl,
}

export const development = config
export const production = config
