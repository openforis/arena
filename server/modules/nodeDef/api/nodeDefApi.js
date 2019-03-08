const Request = require('../../../serverUtils/request')
const Response = require('../../../serverUtils/response')

const AuthMiddleware = require('../../auth/authApiMiddleware')

const NodeDefService = require('../service/nodeDefService')

module.exports.init = app => {

  const sendRespNodeDefs = async (res, surveyId, draft = true, advanced = true, validate = true) => {
    const nodeDefs = await NodeDefService.fetchNodeDefsBySurveyId(surveyId, draft, advanced, validate)
    res.json({ nodeDefs })
  }

  // ==== CREATE

  app.post('/survey/:surveyId/nodeDef', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const { body: nodeDefRequest, user } = req
      const { surveyId, parentUuid, uuid, type, props } = nodeDefRequest

      const nodeDef = await NodeDefService.createNodeDef(user, surveyId, parentUuid, uuid, type, props)

      res.json({ nodeDef })
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  // ==== READ

  app.get(`/survey/:surveyId/nodeDefs`, AuthMiddleware.requireSurveyViewPermission, async (req, res) => {
    try {
      const surveyId = Request.getRestParam(req, 'surveyId')
      const draft = Request.getBoolParam(req, 'draft')
      const validate = Request.getBoolParam(req, 'validate')
      const advanced = true // always fetch advanced props (TODO fetch only what is needed- now in dataentry min/max count are needed)

      await sendRespNodeDefs(res, surveyId, draft, advanced, validate)

    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  // ==== UPDATE

  app.put('/survey/:surveyId/nodeDef/:nodeDefUuid/props', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const { body, user } = req
      const props = body

      const nodeDefUuid = Request.getRestParam(req, 'nodeDefUuid')
      const surveyId = Request.getRestParam(req, 'surveyId')

      await NodeDefService.updateNodeDefProps(user, surveyId, nodeDefUuid, props)

      await sendRespNodeDefs(res, surveyId)

    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  // ==== DELETE

  app.delete('/survey/:surveyId/nodeDef/:nodeDefUuid', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const { user } = req
      const nodeDefUuid = Request.getRestParam(req, 'nodeDefUuid')
      const surveyId = Request.getRestParam(req, 'surveyId')

      await NodeDefService.markNodeDefDeleted(user, surveyId, nodeDefUuid)

      await sendRespNodeDefs(res, surveyId)

    } catch (e) {
      Response.sendErr(res, e)
    }
  })
}
