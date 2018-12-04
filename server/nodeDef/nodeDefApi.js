const {sendErr, sendOk} = require('../serverUtils/response')
const {getRestParam} = require('../serverUtils/request')

const {requireSurveyEditPermission} = require('../authGroup/authMiddleware')

const SurveyManager = require('./../survey/surveyManager')
const NodeDefManager = require('./nodeDefManager')

const UnauthorizedError = require('../authGroup/unauthorizedError')

module.exports.init = app => {

  // ==== CREATE

  app.post('/survey/:surveyId/nodeDef', requireSurveyEditPermission, async (req, res) => {
    try {
      const {body: nodeDefRequest, user} = req
      const {surveyId, parentUuid, uuid, type, props} = nodeDefRequest

      const nodeDef = await NodeDefManager.createNodeDef(user, surveyId, parentUuid, uuid, type, props)

      res.json({nodeDef})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== READ

  // ==== UPDATE

  app.put('/survey/:surveyId/nodeDef/:nodeDefUuid/prop', requireSurveyEditPermission, async (req, res) => {
    try {
      const {body, user} = req
      const {key, value, advanced} = body

      const nodeDefUuid = getRestParam(req, 'nodeDefUuid')
      const surveyId = getRestParam(req, 'surveyId')

      await NodeDefManager.updateNodeDefProp(user, surveyId, nodeDefUuid, key, value, advanced)
      const nodeDefs = await SurveyManager.fetchSurveyNodeDefs(surveyId, true, true)

      res.json({nodeDefs})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== DELETE

  app.delete('/survey/:surveyId/nodeDef/:nodeDefUuid', requireSurveyEditPermission, async (req, res) => {
    try {
      const {user} = req
      const nodeDefUuid = getRestParam(req, 'nodeDefUuid')
      const surveyId = getRestParam(req, 'surveyId')

      await NodeDefManager.markNodeDefDeleted(user, surveyId, nodeDefUuid)

      sendOk(res)
    } catch (e) {
      sendErr(res, e)
    }
  })
}
