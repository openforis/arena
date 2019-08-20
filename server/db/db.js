const Log = require('../log/log')

const logger = Log.getLogger('DB')

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
  ssl: process.env.PGSSL === 'true'
}

const config = process.env.DATABASE_URL
  ? {
    connectionString: process.env.DATABASE_URL,
    ...configCommon
  }
  : {
    user: process.env.PGUSER,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    ...configCommon
  }

const db = pgp(config)

module.exports = db