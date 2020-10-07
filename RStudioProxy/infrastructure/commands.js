const axios = require('axios')

const { SERVICE_URL } = require('../config')

const sendCommand = async ({ command }) => axios.post(SERVICE_URL, command)

const instanceCommands = {
  delete: ({ instanceId }) => ({ command: 'DELETE', payload: { instanceId } }),
  getStatus: () => ({ command: 'GET_STATUS' }),
  getInstanceStatus: ({ instanceId }) => ({ command: 'GET_STATUS', payload: { instanceId } }),
}

module.exports = {
  instanceCommands,
  sendCommand,
}
