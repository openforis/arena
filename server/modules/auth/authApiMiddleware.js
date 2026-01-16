import { ApiAuthMiddleware } from '@openforis/arena-server'

import * as Request from '@server/utils/request'

import * as Authorizer from '@core/auth/authorizer'
import { StatusCodes } from '@core/systemError'
import * as User from '@core/user/user'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
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

const sendUnauthorizedError = ({ res, req = null }) => {
  const userName = req ? User.getName(Request.getUser(req)) : null
  const error = new UnauthorizedError(userName)
  res.send(StatusCodes.UNAUTHORIZED, JSON.stringify(error))
}

export const requireLoggedInUser = async (req, res, next) => {
  const user = Request.getUser(req)
  return user ? next() : sendUnauthorizedError({ res })
}

// Survey
export const requireSurveyCreatePermission = async (req, res, next) => {
  const user = Request.getUser(req)
  if (Authorizer.canCreateSurvey(user)) {
    const ownedSurveys = await SurveyManager.countOwnedSurveys({ user })
    const maxSurveys = Authorizer.getMaxSurveysUserCanCreate(user)
    if (Number.isNaN(maxSurveys) || maxSurveys > ownedSurveys) {
      next()
      return
    }
  }
  sendUnauthorizedError({ req, res })
}
