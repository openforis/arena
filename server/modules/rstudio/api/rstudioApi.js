import * as Request from '@server/utils/request'

import * as User from '@core/user/user'
import * as ProcessUtils from '@core/processUtils'

import { sendPoolCommand } from './rStudioPoolClient'

const RStudioCommands = {
  requestInstance: ({ payload }) => ({ command: 'REQUEST_RSTUDIO', payload }),
  checkInstances: ({ payload }) => ({ command: 'CHECK_INSTANCES', payload }),
  closeInstance: ({ payload }) => ({ command: 'DELETE', payload }),
}

const RStudioApi = async ({ command }) =>
  sendPoolCommand({
    command,
    poolServerUrl: ProcessUtils.ENV.rStudioPoolServerURL,
    poolServiceKey: ProcessUtils.ENV.rStudioPoolServiceKey,
  })

export const init = (app) => {
  app.post('/rstudio', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const userUuid = User.getUuid(user)
      const data = await RStudioApi({ command: RStudioCommands.requestInstance({ payload: { userId: userUuid } }) })
      res.json(data)
    } catch (error) {
      next(error)
    }
  })

  app.get('/rstudio', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const userUuid = User.getUuid(user)
      const data = await RStudioApi({ command: RStudioCommands.checkInstances({ payload: { userId: userUuid } }) })
      res.json(data)
    } catch (error) {
      next(error)
    }
  })

  app.delete('/rstudio', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const userUuid = User.getUuid(user)

      const { instanceId } = Request.getParams(req)

      const data = await RStudioApi({
        command: RStudioCommands.closeInstance({ payload: { userId: userUuid, instanceId } }),
      })
      res.json(data)
    } catch (error) {
      next(error)
    }
  })
}
