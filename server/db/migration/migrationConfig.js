const ProcessUtils = require('../../../core/processUtils')

const config = {
  driver: 'pg',
  user: ProcessUtils.ENV.pgUser,
  password: ProcessUtils.ENV.pgPassword,
  host: ProcessUtils.ENV.pgHost,
  database: ProcessUtils.ENV.pgDatabase,
  ssl: ProcessUtils.ENV.pgSsl,
}

module.exports = {
  development: config,
  production: config,
}
