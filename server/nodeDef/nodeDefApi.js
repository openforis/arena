const {sendErr, sendOk} = require('../serverUtils/response')
const {getRestParam,getBoolParam} = require('../serverUtils/request')

const {requireSurveyEditPermission} = require('../authGroup/authMiddleware')

const NodeDefManager = require('./nodeDefManager')

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

  app.get(`/survey/:surveyId/nodeDefs`, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const draft = getBoolParam(req, 'draft')
      const validate = getBoolParam(req, 'validate')

      const nodeDefs = await NodeDefManager.fetchNodeDefsBySurveyId(surveyId, draft, validate)

      res.json({nodeDefs})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== UPDATE

  app.put('/survey/:surveyId/nodeDef/:nodeDefUuid/props', requireSurveyEditPermission, async (req, res) => {
    try {
      const {body, user} = req
      const props = body

      const nodeDefUuid = getRestParam(req, 'nodeDefUuid')
      const surveyId = getRestParam(req, 'surveyId')

      await NodeDefManager.updateNodeDefProps(user, surveyId, nodeDefUuid, props)
      const nodeDefs = await NodeDefManager.fetchNodeDefsBySurveyId(surveyId, true, true)

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
