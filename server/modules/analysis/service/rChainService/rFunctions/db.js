import * as R from 'ramda'

import { setVar } from './utility'

const connection = 'connection'

const dbConnect = (host, database, user, password, port) =>
  `dbConnect(driver, host="${host}", dbname="${database}", user="${user}", password="${password}", port=${port})`

export const setConnection = (host, database, user, password, port) =>
  setVar(connection, dbConnect(host, database, user, password, port))

export const dbDisconnect = () => `dbDisconnect(${connection})`

export const dbGetQuery = (schema, table, fields = '*', whereConditions = []) => {
  const whereClause = R.isEmpty(whereConditions) ? '' : ` where ${whereConditions.join(' and ')}`
  const statement = `select ${fields} from ${schema}.${table} ${whereClause}`
  return `dbGetQuery(conn=${connection}, statement="${statement}")`
}

export const dbSendQuery = (statement) => `dbSendQuery(conn=${connection}, statement="${statement}")`

export const dbWriteTable = (tableName, dataFrame, append = false) =>
  `dbWriteTable(${connection}, '${tableName}', ${dataFrame}, row.names=F, append=${append ? 'T' : 'F'})`
