const { getRestParam } = require('../serverUtils/request')
const { sendErr } = require('../serverUtils/response')

const SurveyManager = require('../survey/surveyManager')
const RecordManager = require('../record/recordManager')

const {
  canViewSurvey,
  canEditSurvey,
  canCreateRecord,
  canEditRecord,
  canViewRecord,
} = require('../../common/auth/authManager')
const Survey = require('../../common/survey/survey')

const UnauthorizedError = require('./unauthorizedError')

const requireSurveyPermission = permissionFn =>
  async (req, res, next) => {
    const { user } = req
    const survey = await SurveyManager.fetchSurveyById(getRestParam(req, 'surveyId'))

    if (permissionFn(user, Survey.getSurveyInfo(survey))) {
      next()
    } else {
      sendErr(res, new UnauthorizedError(`User ${user.name} is not authorized`))
    }
  }

const requireRecordPermission = (permissionFn) =>
  async (req, res, next) => {
    const { user } = req

    const surveyId = getRestParam(req, 'surveyId')
    const recordUuid = getRestParam(req, 'recordUuid')

    const record = await RecordManager.fetchRecordByUuid(surveyId, recordUuid)

    if (permissionFn(user, record)) {
      next()
    } else {
      sendErr(res, new UnauthorizedError(`User ${user.name} is not authorized`))
    }
  }

module.exports = {
  // Survey
  requireSurveyViewPermission: requireSurveyPermission(canViewSurvey),
  requireSurveyEditPermission: requireSurveyPermission(canEditSurvey),

  // Record
  requireRecordListViewPermission: requireSurveyPermission(canViewSurvey),
  requireRecordCreatePermission: requireSurveyPermission(canCreateRecord),
  requireRecordEditPermission: requireRecordPermission(canEditRecord),
  requireRecordViewPermission: requireSurveyPermission(canViewRecord),
}
