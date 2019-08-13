const R = require('ramda')

const Request = require('../../utils/request')

const SurveyManager = require('../survey/manager/surveyManager')
const RecordService = require('../record/service/recordService')
const UserService = require('../user/service/userService')

const Authorizer = require('../../../common/auth/authorizer')
const Survey = require('../../../common/survey/survey')
const User = require('../../../common/user/user')
const AuthGroups = require('../../../common/auth/authGroups')

const UnauthorizedError = require('../../utils/unauthorizedError')

const checkPermission = (req, next, permissionFn, obj) => {
  const user = Request.getUser(req)

  if (permissionFn(user, obj)) {
    next()
  } else {
    next(new UnauthorizedError(user && user.name))
  }

}

const requireSurveyPermission = permissionFn => async (req, res, next) => {
  try {
    const { surveyId } = Request.getParams(req)
    const survey = await SurveyManager.fetchSurveyById(surveyId)
    const surveyInfo = Survey.getSurveyInfo(survey)

    checkPermission(req, next, permissionFn, surveyInfo)
  } catch (e) {
    next(e)
  }
}

const requireRecordPermission = permissionFn => async (req, res, next) => {
  try {
    const { surveyId, recordUuid } = Request.getParams(req)

    const record = await RecordService.fetchRecordByUuid(surveyId, recordUuid)

    checkPermission(req, next, permissionFn, record)
  } catch (e) {
    next(e)
  }
}

// const requireUserEditPermissions = async (req, res, next) => {
//   const { user } = req
//   const { user: userToEdit } = Request.getParams(req)
//
//   const userGroups = User.getAuthGroups(user)
//   const userToEditGroups = User.getAuthGroups(userToEdit)
//
//   // find groups in common
//   const commonGroups = R.innerJoin(
//     (userGroup, userToEditGroup) => AuthGroups.getUuid(userGroup) === AuthGroups.getUuid(surveyGroup),
//     userGroups,
//     userToEditGroups
//   )
//
//   console.log(commonGroups)
// }

const requireUserPermission = permissionFn => async (req, res, next) => {
  try {
    const { userUuid } = Request.getParams(req)
    const userToEdit = await UserService.fetchUserByUuid(userUuid)

    checkPermission(req, next, permissionFn, userToEdit)
  } catch (e) {
    next(e)
  }
}

module.exports = {
  // Survey
  requireSurveyViewPermission: requireSurveyPermission(Authorizer.canViewSurvey),
  requireSurveyEditPermission: requireSurveyPermission(Authorizer.canEditSurvey),

  // Record
  requireRecordListViewPermission: requireSurveyPermission(Authorizer.canViewSurvey),
  requireRecordCreatePermission: requireSurveyPermission(Authorizer.canCreateRecord),
  requireRecordEditPermission: requireRecordPermission(Authorizer.canEditRecord),
  requireRecordViewPermission: requireSurveyPermission(Authorizer.canViewRecord),

  // User
  // requireUserEditPermission: requireUserEditPermissions,
  requireUserInvitePermission: requireSurveyPermission(Authorizer.canInviteUsers),
  requireUserViewPermission: requireUserPermission(Authorizer.canViewUser),
  requireUserEditPermission: requireUserPermission(() => true),
}
