import type { NextFunction, Request as ExpressRequest, Response } from 'express'

import { Authorizer } from '@openforis/arena-core'
import { Requests } from '@openforis/arena-server'

import * as Record from '@core/record/record'
import * as UserUtils from '@core/user/user'
import { StatusCodes } from '@core/systemError'

import * as Request from '@server/utils/request'
import UnauthorizedError from '@server/utils/unauthorizedError'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as RecordManager from '@server/modules/record/manager/recordManager'

const _requireNotOwnedRecordsViewAllowed =
  (getRecordUuids: (req: ExpressRequest) => string[]) =>
  async (req: ExpressRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { surveyId } = Request.getParams(req)
      const user = Request.getUser(req)
      const recordUuids = getRecordUuids(req).filter(Boolean)
      if (recordUuids.length === 0) {
        next()
        return
      }
      const surveyInfo = await SurveyManager.fetchSurveyById({ surveyId })
      if (Authorizer.canViewNotOwnedRecords(user, surveyInfo)) {
        next()
        return
      }
      const userUuid = UserUtils.getUuid(user)
      const records = await RecordManager.fetchRecordsByUuids(surveyId, recordUuids)
      if (records.every((record) => Record.getOwnerUuid(record) === userUuid)) {
        next()
        return
      }
      const error = new UnauthorizedError(UserUtils.getName(user))
      res.status(StatusCodes.FORBIDDEN).send(JSON.stringify(error))
    } catch (error) {
      next(error)
    }
  }

/**
 * Rejects requests reading a record owned by another user when the user's role cannot view not owned records
 * (survey security settings, see Authorizer.canViewNotOwnedRecords).
 */
export const requireNotOwnedRecordViewAllowed = _requireNotOwnedRecordsViewAllowed((req) => [
  Request.getParams(req).recordUuid,
])

/**
 * Plural variant of requireNotOwnedRecordViewAllowed, for batch endpoints (`recordUuids` param).
 */
export const requireNotOwnedRecordsViewAllowed = _requireNotOwnedRecordsViewAllowed(
  (req) => Requests.getArrayParam('recordUuids')(req) as string[]
)
