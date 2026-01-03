import { ApiAuthMiddleware } from '@openforis/arena-server'

import * as Request from '@server/utils/request'
import * as JobUtils from '@server/job/jobUtils'

import { MessageService } from '../service/messageService'

export const init = (app) => {
  app.post('/message/send', ApiAuthMiddleware.requireAdminPermission, async (req, res, next) => {
    try {
      const { messageUuid } = Request.getParams(req)
      const user = Request.getUser(req)

      const job = MessageService.startMessageSendJob({ user, messageUuid })

      res.json(JobUtils.jobToJSON(job))
    } catch (error) {
      next(error)
    }
  })
}
