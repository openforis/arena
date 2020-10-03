const { requestInstance, removeInstance, checkStatus } = require('../useCases')

const commandHandlers = {
  REQUEST_RSTUDIO: requestInstance,
  GET_STATUS: checkStatus,
  DELETE: removeInstance,
}

const getCommandHandler = (body) => {
  const { command } = body
  return command ? commandHandlers[command] : false
}
exports.handler = async (event = {}) => {
  const { body = '' } = event
  const bodyParsed = JSON.parse(body)
  const { payload = {} } = body
  const commandHandler = getCommandHandler(bodyParsed)

  console.log('payload', payload, commandHandler)
  if (commandHandler) {
    return commandHandler(payload)
  }
  const response = {
    statusCode: 200,
    body: JSON.stringify({ status: event }),
  }
  return response
}
