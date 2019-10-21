import Log from '../log/log';

const logger = Log.getLogger('DB')

import ProcessUtils from '../../core/processUtils';

const debugOptions = {
  query: (e) => {
    logger.debug(`QUERY: ${e.query}`)
    if (e.params) {
      logger.debug(`PARAMS: ${JSON.stringify(e.params)}`)
    }
  }
}

// const pgp = require('pg-promise')(debugOptions)
import pgpFactory from 'pg-promise';
const pgp = pgpFactory({});

import { IConnectionParameters } from 'pg-promise/typescript/pg-subset';


const configCommon = {
  // how long a client is allowed to remain idle before being closed
  idleTimeoutMillis: 30000,
  // max number of clients in the pool
  max: 10,
  // whether to use ssl connections
  ssl: ProcessUtils.ENV.pgSsl
}

const config: IConnectionParameters = ProcessUtils.ENV.dbUrl
  ? {
    connectionString: ProcessUtils.ENV.dbUrl,
    ...configCommon
  }
  : {
    user: ProcessUtils.ENV.pgUser,
    database: ProcessUtils.ENV.pgDatabase,
    password: ProcessUtils.ENV.pgPassword,
    host: ProcessUtils.ENV.pgHost,
    port: (port => port ? +port : undefined)(ProcessUtils.ENV.pgPort),
    ...configCommon
  }

const db = pgp(config)

export default db;
