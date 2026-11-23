import type { NextFunction, Request as ExpressRequest, Response as ExpressResponse } from 'express'
import { ApiAuthMiddleware } from '@openforis/arena-server'

import * as Request from '@server/utils/request'

import { type ArenaSurvey, Authorizer, ServiceRegistry, ServiceType } from '@openforis/arena-core'
import { canEditSurveyAiPolicy } from '@common/ai/policy'
import { StatusCodes } from '@core/systemError'
import * as User from '@core/user/user'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as UserManager from '@server/modules/user/manager/userManager'
import UnauthorizedError from '@server/utils/unauthorizedError'

export const {
  requireAdminPermission,
  requireCanExportSurveysList,
  // Record
  requireRecordAnalysisPermission,
  requireRecordCleansePermission,
  requireRecordCreatePermission,
  requireRecordEditPermission,
  requireRecordViewPermission,
  requireRecordListViewPermission,
  requireRecordListExportPermission,
  requireRecordOwnerChangePermission,
  requireRecordStepEditPermission,
  requireRecordsEditPermission,
  requireRecordsExportPermission,
  // Map
  requireMapUsePermission,
  // Survey
  requireSurveyConfigEditPermission,
  requireSurveyEditPermission,
  requireSurveyOwnerEditPermission,
  requireSurveyViewPermission,
  requireUserEditPermission,
  requireUserInvitePermission,
  requireUserRemovePermission,
  requireUserViewPermission,
  requireSurveyRdbRefreshPermission,
  // User
  requireUserNameViewPermission,
  requireUsersAllViewPermission,
  requireUserCreatePermission,
  // User access requests
  requireCanViewAccessRequestsPermission,
  requireCanEditAccessRequestsPermission,
  // Download token middleware
  requireDownloadToken,
} = ApiAuthMiddleware

const sendError = ({
  errorCode,
  res,
  req = null,
}: {
  errorCode: number
  res: ExpressResponse
  req?: ExpressRequest | null
}): void => {
  const userName = req ? User.getName(Request.getUser(req)) : null
  const error = new UnauthorizedError(userName)
  res.status(errorCode).send(JSON.stringify(error))
}

const sendUnauthorizedError = ({ res, req = null }: { res: ExpressResponse; req?: ExpressRequest | null }): void => {
  sendError({ errorCode: StatusCodes.UNAUTHORIZED, res, req })
}

const sendForbiddenError = ({ res, req = null }: { res: ExpressResponse; req?: ExpressRequest | null }): void => {
  sendError({ errorCode: StatusCodes.FORBIDDEN, res, req })
}

export const requireLoggedInUser = (req: ExpressRequest, res: ExpressResponse, next: NextFunction): void => {
  const user = Request.getUser(req)
  if (user) {
    next()
  } else {
    sendUnauthorizedError({ res })
  }
}

export const requireSurveyUserExtraPropsEditPermission = async (
  req: ExpressRequest,
  res: ExpressResponse,
  next: NextFunction
): Promise<void> => {
  const { surveyId, userUuid } = Request.getParams(req)
  const user = Request.getUser(req)
  const surveyInfo = await SurveyManager.fetchSurveyById({ surveyId })
  const userToUpdate = await UserManager.fetchUserByUuid(userUuid)
  if (userToUpdate && Authorizer.canEditUserAuthGroupExtraProps(user, surveyInfo, userToUpdate)) {
    next()
    return
  }
  return sendForbiddenError({ req, res })
}

/**
 * Builds the middleware allowing only survey administrators (and system admins) to change the survey AI policy.
 * @param {object} [deps] - Dependencies (tests).
 * @param {Function} [deps.fetchSurveyInfo] - `(surveyId) => Promise<surveyInfo>`.
 * @returns {Function} The Express middleware.
 */
export const createRequireSurveyAiPolicyEditPermission =
  ({
    fetchSurveyInfo = (surveyId: number) => SurveyManager.fetchSurveyById({ surveyId }),
  }: { fetchSurveyInfo?: (surveyId: number) => Promise<ArenaSurvey> } = {}) =>
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction): Promise<void> => {
    const { surveyId } = Request.getParams(req)
    const user = Request.getUser(req)
    const surveyInfo = await fetchSurveyInfo(surveyId)
    if (canEditSurveyAiPolicy(user, surveyInfo)) {
      next()
      return
    }
    sendForbiddenError({ req, res })
  }

export const requireSurveyAiPolicyEditPermission = createRequireSurveyAiPolicyEditPermission()

export const requireSurveyCloneFromViewPermission = async (
  req: ExpressRequest,
  res: ExpressResponse,
  next: NextFunction
): Promise<void> => {
  const { cloneFrom } = Request.getBody(req)
  if (!cloneFrom) {
    next()
    return
  }
  const user = Request.getUser(req)
  const sourceSurveyInfo = await SurveyManager.fetchSurveyById({ surveyId: cloneFrom })
  // published templates can be cloned by any user allowed to create surveys
  if (Authorizer.canViewSurveyOrPublishedTemplate(user, sourceSurveyInfo)) {
    next()
    return
  }
  sendForbiddenError({ req, res })
}

// survey export: what the export includes depends also on the user role (see SurveyService.createSurveyExportJob)
export const requireSurveyExportPermission = async (
  req: ExpressRequest,
  res: ExpressResponse,
  next: NextFunction
): Promise<void> => {
  const { surveyId } = Request.getParams(req)
  const user = Request.getUser(req)
  const surveyInfo = await SurveyManager.fetchSurveyById({ surveyId })
  if (Authorizer.canExportSurvey(user, surveyInfo)) {
    next()
    return
  }
  sendForbiddenError({ req, res })
}

// survey compare: the survey used as source must be visible to the user (published templates included)
export const requireSurveyCompareSourceViewPermission = async (
  req: ExpressRequest,
  res: ExpressResponse,
  next: NextFunction
): Promise<void> => {
  const { sourceSurveyId } = Request.getParams(req)
  if (!sourceSurveyId) {
    next()
    return
  }
  const user = Request.getUser(req)
  const sourceSurveyInfo = await SurveyManager.fetchSurveyById({ surveyId: Number(sourceSurveyId) })
  if (Authorizer.canViewSurveyOrPublishedTemplate(user, sourceSurveyInfo)) {
    next()
    return
  }
  sendForbiddenError({ req, res })
}

// records merge: the user must be able to edit both the source and the target record
export const requireRecordsMergePermission = async (
  req: ExpressRequest,
  res: ExpressResponse,
  next: NextFunction
): Promise<void> => {
  const { surveyId, sourceRecordUuid, targetRecordUuid } = Request.getParams(req)
  const user = Request.getUser(req)
  const recordService = ServiceRegistry.getInstance().getService(ServiceType.record)
  const records = await recordService.getManyByUuids({ surveyId, uuids: [sourceRecordUuid, targetRecordUuid] })
  if (
    sourceRecordUuid !== targetRecordUuid &&
    records.length === 2 &&
    records.every((record) => Authorizer.canEditRecord(user, record))
  ) {
    next()
    return
  }
  sendForbiddenError({ req, res })
}

// Survey
export const requireSurveyCreatePermission = async (
  req: ExpressRequest,
  res: ExpressResponse,
  next: NextFunction
): Promise<void> => {
  const user = Request.getUser(req)
  if (Authorizer.canCreateSurvey(user)) {
    const ownedSurveys = await SurveyManager.countOwnedSurveys({ user })
    const maxSurveys = Authorizer.getMaxSurveysUserCanCreate(user)
    if (Number.isNaN(maxSurveys) || maxSurveys > ownedSurveys) {
      next()
      return
    }
    // User is allowed to create surveys but has exceeded their quota
    sendForbiddenError({ req, res })
    return
  }
  sendUnauthorizedError({ req, res })
}
