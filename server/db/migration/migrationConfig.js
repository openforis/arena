const ProcessEnv = require('../../system/processEnv')

module.exports = {

  development: {
    driver: 'pg',
    user: ProcessEnv.pgUser,
    password: ProcessEnv.pgPassword,
    host: ProcessEnv.pgHost,
    database: ProcessEnv.pgDatabase,
    schema: ProcessEnv.pgSchema,
  },

  production: {
    ssl: true,
  }

}