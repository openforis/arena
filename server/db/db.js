const Log = require('../log/log')

const logger = Log.getLogger('DB')

const ProcessEnv = require('../utils/processEnv')

const debugOptions = {
  query: (e) => {
    logger.debug(`QUERY: ${e.query}`)
    if (e.params) {
      logger.debug(`PARAMS: ${JSON.stringify(e.params)}`)
    }
  }
}

// const pgp = require('pg-promise')(debugOptions)
const pgp = require('pg-promise')({})

const configCommon = {
  // how long a client is allowed to remain idle before being closed
  idleTimeoutMillis: 30000,
  // max number of clients in the pool
  max: 10,
  // whether to use ssl connections
  ssl: ProcessEnv.pgSsl
}

const config = ProcessEnv.dbUrl
  ? {
    connectionString: ProcessEnv.dbUrl,
    ...configCommon
  }
  : {
    user: ProcessEnv.pgUser,
    database: ProcessEnv.pgDatabase,
    password: ProcessEnv.pgPassword,
    host: ProcessEnv.pgHost,
    port: ProcessEnv.pgPort,
    ...configCommon
  }

const db = pgp(config)

module.exports = db