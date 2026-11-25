import type { Router } from 'express'

import * as ProcessUtils from '@core/processUtils'
import * as User from '@core/user/user'
import { requireRecordAnalysisPermission } from '@server/modules/auth/authApiMiddleware'
import * as Request from '@server/utils/request'

import { sendPoolCommand } from './rStudioPoolClient'

type RStudioCommand = { command: string; payload: Record<string, unknown> }
type RStudioCommandFactory = (params: { payload: Record<string, unknown> }) => RStudioCommand

const RStudioCommands: Record<string, RStudioCommandFactory> = {
  requestInstance: ({ payload }) => ({ command: 'REQUEST_RSTUDIO', payload }),
  checkInstances: ({ payload }) => ({ command: 'CHECK_INSTANCES', payload }),
  closeInstance: ({ payload }) => ({ command: 'DELETE', payload }),
}

const RStudioApi = async ({ command }: { command: RStudioCommand }) =>
  sendPoolCommand({
    command,
    poolServerUrl: ProcessUtils.ENV.rStudioPoolServerURL,
    poolServiceKey: ProcessUtils.ENV.rStudioPoolServiceKey,
  })

// sessions are per user, but only users who can analyse the survey data can manage them
const path = '/survey/:surveyId/rstudio'

export const init = (app: Router): void => {
  app.post(path, requireRecordAnalysisPermission, async (req, res) => {
    const user = Request.getUser(req)
    const userUuid = User.getUuid(user)
    const data = await RStudioApi({ command: RStudioCommands.requestInstance({ payload: { userId: userUuid } }) })
    res.json(data)
  })

  app.get(path, requireRecordAnalysisPermission, async (req, res) => {
    const user = Request.getUser(req)
    const userUuid = User.getUuid(user)
    const data = await RStudioApi({ command: RStudioCommands.checkInstances({ payload: { userId: userUuid } }) })
    res.json(data)
  })

  app.delete(path, requireRecordAnalysisPermission, async (req, res) => {
    const user = Request.getUser(req)
    const userUuid = User.getUuid(user)

    const { instanceId } = Request.getParams(req)

    const data = await RStudioApi({
      command: RStudioCommands.closeInstance({ payload: { userId: userUuid, instanceId } }),
    })
    res.json(data)
  })
}
