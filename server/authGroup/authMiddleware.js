const {getRestParam} = require('../serverUtils/request')
const {sendErr} = require('../serverUtils/response')

const {fetchSurveyById} = require('../survey/surveyManager')
const {fetchRecordByUuid} = require('../record/recordManager')

const {
  canEditSurvey,
  canEditRecord,
} = require('../../common/auth/authManager')
const Survey = require('../../common/survey/survey')

const UnauthorizedError = require('./unauthorizedError')

const requireSurveyPermission = (permissionFn) =>
  async (req, res, next) => {
    const {user} = req
    const survey = await fetchSurveyById(getRestParam(req, 'surveyId'))

    if (permissionFn(user, Survey.getSurveyInfo(survey))) {
      next()
    } else {
      sendErr(res, new UnauthorizedError(`User ${user.name} is not authorized`))
    }
  }

const requireRecordPermission = (permissionFn) =>
  async (req, res, next) => {
    const {user} = req

    const surveyId = getRestParam(req, 'surveyId')
    const recordUuid = getRestParam(req, 'recordUuid')

    const record = await fetchRecordByUuid(surveyId, recordUuid)
    // console.log(record)

    // TODO check that record.surveUid and surveyId match
    if (permissionFn(user, record)) {
      next()
    } else {
      sendErr(res, new UnauthorizedError(`User ${user.name} is not authorized`))
    }
  }

module.exports = {
  requireSurveyEditPermission: requireSurveyPermission(canEditSurvey),
  requireRecordEditPermission: requireRecordPermission(canEditRecord),
}
