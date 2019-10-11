const ProcessUtils = require('../../../core/processUtils')

module.exports = {

  development: {
    driver: 'pg',
    user: ProcessUtils.ENV.pgUser,
    password: ProcessUtils.ENV.pgPassword,
    host: ProcessUtils.ENV.pgHost,
    database: ProcessUtils.ENV.pgDatabase,
    schema: ProcessUtils.ENV.pgSchema,
  },

  production: {
    ssl: true,
  }

}