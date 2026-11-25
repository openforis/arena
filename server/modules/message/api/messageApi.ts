import type { Router } from 'express'

import { ApiAuthMiddleware } from '@openforis/arena-server'

import * as JobUtils from '@server/job/jobUtils'
import * as Request from '@server/utils/request'
import { MessageService } from '../service/messageService'

export const init = (app: Router): void => {
  app.post('/message/send', ApiAuthMiddleware.requireAdminPermission, (req, res) => {
    const { messageUuid } = Request.getParams(req)
    const user = Request.getUser(req)

    const job = MessageService.startMessageSendJob({ user, messageUuid })

    res.json(JobUtils.jobToJSON(job))
  })
}
