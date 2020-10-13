import axios from 'axios'

import * as Request from '@server/utils/request'

import * as User from '@core/user/user'
import * as ProcessUtils from '@core/processUtils'

export const init = (app) => {
  app.post('/rstudio', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const userUuid = User.getUuid(user)

      const { data } = await axios.post(ProcessUtils.ENV.rStudioPoolServerURL, {
        command: 'REQUEST_RSTUDIO',
        payload: { userId: userUuid },
      })

      res.json(data)
    } catch (error) {
      next(error)
    }
  })
}
