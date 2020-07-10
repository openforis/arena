import BluebirdPromise from 'bluebird'
import pgPromise from 'pg-promise'
import * as ProcessUtils from '@core/processUtils'
import * as Log from '@server/log/log'

const logger = Log.getLogger('DB')

const debugOptions = {
  query: (e) => {
    logger.debug(`QUERY: ${e.query}`)
    if (e.params) {
      logger.debug(`PARAMS: ${JSON.stringify(e.params)}`)
    }
  },
}

// Enable all options that help with debugging.
// TODO: Re-consider these later when the app matures.
BluebirdPromise.config({
  // Enable warnings
  warnings: true,
  // Enable long stack traces
  longStackTraces: true,
  // Enable cancellation
  cancellation: true,
  // Enable monitoring
  monitoring: true,
  // Enable async hooks
  asyncHooks: true,
})

const initOptions = {
  promiseLib: BluebirdPromise,
  ...(ProcessUtils.ENV.debug ? debugOptions : {}),
}

const pgp = pgPromise(initOptions)

// Timestamp will automatically be converted to UTC time-zone - No need to convert in select queries anymore
// 1114 is OID for timestamp in Postgres
pgp.pg.types.setTypeParser(1114, (str) => new Date(`${str} GMT`))

const configCommon = {
  // How long a client is allowed to remain idle before being closed
  idleTimeoutMillis: 30000,
  // Max number of clients in the pool
  max: 10,
  // Whether to use ssl connections
  ssl: ProcessUtils.ENV.pgSsl,
}

const config = ProcessUtils.ENV.dbUrl
  ? {
      connectionString: ProcessUtils.ENV.dbUrl,
      ...configCommon,
    }
  : {
      user: ProcessUtils.ENV.pgUser,
      database: ProcessUtils.ENV.pgDatabase,
      password: ProcessUtils.ENV.pgPassword,
      host: ProcessUtils.ENV.pgHost,
      port: ProcessUtils.ENV.pgPort,
      ...configCommon,
    }

export const db = pgp(config)
