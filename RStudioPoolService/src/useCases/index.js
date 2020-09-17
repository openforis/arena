// requestInstance -> get a Free Instance o create a new one ( save or update into the redis ) -> return instance id

const requestInstance = require('./requestInstance')
const checkStatus = require('./checkStatus')
const removeInstance = require('./removeInstance')

module.exports = {
  requestInstance,
  checkStatus,
  removeInstance,
}
