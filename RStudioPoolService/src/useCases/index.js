const requestInstance = require('./requestInstance')
const checkStatus = require('./checkStatus')
const removeInstance = require('./removeInstance')

module.exports = {
  requestInstance,
  checkStatus,
  removeInstance,
}

/*
 {
  COMMAND -> REQUEST_RSTUDIO, CREATE, GET_STATUS, DELETE
  PAYLOAD
 }

 REQUEST_RSTUDIO
 { userId } -> { instanceId}

 CREATE
 { numberOfInstances } -> OK

 GET_STATUS
 {} -> all the status
 { userId } -> instanceInfo

 DELETE
 { userId } -> OK
 */