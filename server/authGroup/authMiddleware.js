const R = require('ramda')

const {getRestParam} = require('../serverUtils/request')
const {sendErr} = require('../serverUtils/response')
const {fetchSurveyById} = require('../survey/surveyManager')
const {fetchNodeDef} = require('../nodeDef/nodeDefManager')

const {canEditSurvey} = require('../../common/auth/authManager')

const UnauthorizedError = require('./unauthorizedError')

function requireSurveyPermission (permissionFn, surveyIdGetter) {
  return async (req, res, next) => {
    const user = req.user
    const survey = await fetchSurveyById(await surveyIdGetter(req))
    if (permissionFn(user, survey)) {
      next()
    } else {
      sendErr(res, new UnauthorizedError(`User ${user.name} is not authorized`))
    }
  }
}

const getSurveyId = req => getRestParam(req, 'surveyId')

const getNodeDefSurveyId = req => R.path(['body', 'surveyId'], req)

const getNodeDefPropSurveyId = async req => {
  const nodeDefId = getRestParam(req, 'nodeDefId')
  return R.prop('surveyId', await fetchNodeDef(nodeDefId))
}

module.exports = {
  requireSurveyEditPermission: requireSurveyPermission(canEditSurvey, getSurveyId),
  requireNodeDefEditPermission: requireSurveyPermission(canEditSurvey, getNodeDefSurveyId),
  requireNodeDefPropEditPermission: requireSurveyPermission(canEditSurvey, getNodeDefPropSurveyId),
}
