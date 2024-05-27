import * as Request from '@server/utils/request'

import * as Authorizer from '@core/auth/authorizer'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import UnauthorizedError from '@server/utils/unauthorizedError'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as RecordService from '@server/modules/record/service/recordService'
import * as UserService from '@server/modules/user/service/userService'

const checkPermission = (req, next, permissionFn, ...args) => {
  const user = Request.getUser(req)

  if (permissionFn(user, ...args)) {
    next()
  } else {
    next(new UnauthorizedError(User.getName(user)))
  }
}

const requirePermission = (permissionFn) => async (req, _res, next) => {
  try {
    checkPermission(req, next, permissionFn)
  } catch (error) {
    next(error)
  }
}

const requireSurveyPermission = (permissionFn) => async (req, _res, next) => {
  try {
    const { surveyId } = Request.getParams(req)
    const survey = await SurveyManager.fetchSurveyById({ surveyId })
    const surveyInfo = Survey.getSurveyInfo(survey)

    checkPermission(req, next, permissionFn, surveyInfo)
  } catch (error) {
    next(error)
  }
}

const requireRecordPermission = (permissionFn) => async (req, _res, next) => {
  try {
    const { surveyId, recordUuid } = Request.getParams(req)

    const record = await RecordService.fetchRecordByUuid(surveyId, recordUuid)

    checkPermission(req, next, permissionFn, record)
  } catch (error) {
    next(error)
  }
}

const requireRecordsPermission = (permissionFn) => async (req, _res, next) => {
  try {
    const { surveyId, recordUuids } = Request.getParams(req)
    const user = Request.getUser(req)

    const records = await RecordService.fetchRecordsByUuids(surveyId, recordUuids)
    const hasPermission = records.every((record) => permissionFn(user, record))
    if (hasPermission) {
      next()
    } else {
      next(new UnauthorizedError(User.getName(user)))
    }
  } catch (error) {
    next(error)
  }
}

const requireUserPermission = (permissionFn) => async (req, _res, next) => {
  try {
    const { surveyId, userUuid } = Request.getParams(req)
    const survey = surveyId ? await SurveyManager.fetchSurveyById({ surveyId }) : null
    const surveyInfo = survey ? Survey.getSurveyInfo(survey) : null
    const user = await UserService.fetchUserByUuid(userUuid)

    checkPermission(req, next, permissionFn, surveyInfo, user)
  } catch (error) {
    next(error)
  }
}

export const requireLoggedInUser = async (req, _res, next) => {
  const user = Request.getUser(req)
  return user ? next() : next(new UnauthorizedError())
}

// Survey
export const requireSurveyCreatePermission = async (req, _res, next) => {
  const user = Request.getUser(req)
  if (Authorizer.canCreateSurvey(user)) {
    const ownedSurveys = await SurveyManager.countOwnedSurveys({ user })
    const maxSurveys = Authorizer.getMaxSurveysUserCanCreate(user)
    if (Number.isNaN(maxSurveys) || maxSurveys > ownedSurveys) {
      next()
      return
    }
  }
  next(new UnauthorizedError(User.getName(user)))
}
export const requireSurveyViewPermission = requireSurveyPermission(Authorizer.canViewSurvey)
export const requireSurveyEditPermission = requireSurveyPermission(Authorizer.canEditSurvey)
export const requireRecordCleansePermission = requireSurveyPermission(Authorizer.canCleanseRecords)
export const requireSurveyRdbRefreshPermission = requirePermission(Authorizer.canRefreshAllSurveyRdbs)
export const requireCanExportSurveysList = requirePermission(Authorizer.canExportSurveysList)

// Record
export const requireRecordListViewPermission = requireSurveyPermission(Authorizer.canViewSurvey)
export const requireRecordListExportPermission = requireSurveyPermission(Authorizer.canExportRecordsList)
export const requireRecordCreatePermission = requireSurveyPermission(Authorizer.canCreateRecord)
export const requireRecordEditPermission = requireRecordPermission(Authorizer.canEditRecord)
export const requireRecordsEditPermission = requireRecordsPermission(Authorizer.canEditRecord)
export const requireRecordViewPermission = requireSurveyPermission(Authorizer.canViewRecord)
export const requireRecordAnalysisPermission = requireSurveyPermission(Authorizer.canAnalyzeRecords)
export const requireRecordsExportPermission = requireSurveyPermission(Authorizer.canExportRecords)

// Map
export const requireMapUsePermission = requireSurveyPermission(Authorizer.canUseMap)

// User
export const requireUserInvitePermission = requireSurveyPermission(Authorizer.canInviteUsers)
export const requireUserViewPermission = requireUserPermission(Authorizer.canViewUser)
export const requireUserNameViewPermission = requireUserPermission(Authorizer.canViewOtherUsersNameInSameSurvey)
export const requireUsersAllViewPermission = requirePermission(Authorizer.canViewAllUsers)
export const requireUserEditPermission = requireUserPermission(Authorizer.canEditUser)
export const requireUserRemovePermission = requireUserPermission(Authorizer.canRemoveUser)
// User access requests
export const requireCanViewAccessRequestsPermission = requirePermission(Authorizer.canViewUsersAccessRequests)
export const requireCanEditAccessRequestsPermission = requirePermission(Authorizer.canEditUsersAccessRequests)
