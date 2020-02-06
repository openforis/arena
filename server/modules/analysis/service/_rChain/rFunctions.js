import * as R from 'ramda'

// ==== arena constants

export const arenaStartTime = 'arena.startTime'

export const arenaEndTime = 'arena.endTime'

// ==== arena functions

export const arenaInfo = (fileName, content) => `arena.info('${fileName}', ${content})`

// ==== R utility functions

export const NA = 'NA'

export const setVar = (name, value) => `${name} <- ${value}`

export const dfVar = (dataFrame, varName) => `${dataFrame}$${varName}`

// ==== db functions

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

export const dbSendQuery = statement => `dbSendQuery(conn=${connection}, statement="${statement}")`

export const dbWriteTable = (tableName, dataFrame, append = false) =>
  `dbWriteTable(${connection}, '${tableName}', ${dataFrame}, row.names=F, append=${append ? 'T' : 'F'})`

export const sysTime = () => `Sys.time()`
