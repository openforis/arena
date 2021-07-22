import axios from 'axios'

import * as Request from '@server/utils/request'

import * as User from '@core/user/user'
import * as ProcessUtils from '@core/processUtils'

const RStudioCommands = {
  requestInstance: ({ payload }) => ({ command: 'REQUEST_RSTUDIO', payload }),
  checkInstances: ({ payload }) => ({ command: 'CHECK_INSTANCES', payload }),
}

const RStudioApi = async ({ command }) =>
  axios.post(ProcessUtils.ENV.rStudioPoolServerURL, command, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: ProcessUtils.ENV.rStudioPoolServiceKey,
    },
  })

export const init = (app) => {
  app.post('/rstudio', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const userUuid = User.getUuid(user)
      const { data } = await RStudioApi({ command: RStudioCommands.requestInstance({ payload: { userId: userUuid } }) })
      res.json(data)
    } catch (error) {
      next(error)
    }
  })

  app.get('/rstudio', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const userUuid = User.getUuid(user)
      const { data } = await RStudioApi({ command: RStudioCommands.checkInstances({ payload: { userId: userUuid } }) })
      res.json(data)
    } catch (error) {
      next(error)
    }
  })
}
