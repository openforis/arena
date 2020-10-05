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
  COMMAND -> REQUEST, CREATE, GET_STATUS, DELETE
  PAYLOAD
 }

 REQUEST
 { userId } -> { instanceId}

 CREATE
 { numberOfInstances } -> OK

 GET_STATUS
 {} -> all the status
 { instanceId } -> instanceInfo

 DELETE
 { instanceId } -> OK
 */