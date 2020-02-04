// ==== arena constants

export const arenaStartTime = 'arena.startTime'

export const arenaEndTime = 'arena.endTime'

// ==== arena functions

export const arenaInfo = (fileName, content) => `arena.info('${fileName}', ${content})`

// ==== R utility functions

export const setVar = (name, value) => `${name} <- ${value}`

// ==== db functions
const connection = 'connection'

export const dbConnect = (host, database, user, password, port) =>
  setVar(
    connection,
    `dbConnect(driver, host="${host}", dbname="${database}", user="${user}", password="${password}", port=${port})`,
  )

export const dbDisconnect = () => `dbDisconnect(${connection})`

export const dbGetQuery = (schema, table, fields = '*') =>
  `dbGetQuery(conn=${connection}, statement="select ${fields} from ${schema}.${table}")`

export const dbSendQuery = statement => `dbSendQuery(conn=${connection}, statement="${statement}")`

export const sysTime = () => `Sys.time()`
