const Request = require('../../utils/request')

const SurveyManager = require('../survey/manager/surveyManager')
const RecordService = require('../record/service/recordService')

const Authorizer = require('../../../common/auth/authorizer')
const Survey = require('../../../common/survey/survey')

const UnauthorizedError = require('../../utils/unauthorizedError')

const checkPermission = (req, res, next, permissionFn, obj) => {
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

    checkPermission(req, res, next, permissionFn, surveyInfo)
  } catch (e) {
    next(e)
  }
}

const requireRecordPermission = permissionFn => async (req, res, next) => {
  try {
    const { surveyId, recordUuid } = Request.getParams(req)

    const record = await RecordService.fetchRecordByUuid(surveyId, recordUuid)

    checkPermission(req, res, next, permissionFn, record)
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
}
