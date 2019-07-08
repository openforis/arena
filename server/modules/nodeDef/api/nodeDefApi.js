const Request = require('../../../utils/request')

const AuthMiddleware = require('../../auth/authApiMiddleware')

const NodeDefService = require('../service/nodeDefService')

module.exports.init = app => {

  const sendRespNodeDefs = async (res, surveyId, draft = true, advanced = true, validate = true) => {
    const nodeDefs = await NodeDefService.fetchNodeDefsBySurveyId(surveyId, draft, advanced, validate)
    res.json({ nodeDefs })
  }

  // ==== CREATE

  app.post('/survey/:surveyId/nodeDef', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const { body: nodeDefRequest } = req
      const { surveyId } = Request.getParams(req)
      const user = Request.getUser(req)

      const nodeDef = await NodeDefService.insertNodeDef(user, surveyId, nodeDefRequest)

      res.json({ nodeDef })
    } catch (err) {
      next(err)
    }
  })

  // ==== READ

  app.get(`/survey/:surveyId/nodeDefs`, AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const surveyId = Request.getRestParam(req, 'surveyId')
      const draft = Request.getBoolParam(req, 'draft')
      const validate = Request.getBoolParam(req, 'validate')
      const advanced = true // always fetch advanced props (TODO fetch only what is needed- now in dataentry min/max count are needed)

      await sendRespNodeDefs(res, surveyId, draft, advanced, validate)

    } catch (err) {
      next(err)
    }
  })

  // ==== UPDATE

  app.put('/survey/:surveyId/nodeDef/:nodeDefUuid/props', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const { body, user } = req
      const { props, propsAdvanced } = body

      const { surveyId, nodeDefUuid } = Request.getParams(req)

      await NodeDefService.updateNodeDefProps(user, surveyId, nodeDefUuid, props, propsAdvanced)

      await sendRespNodeDefs(res, surveyId)

    } catch (err) {
      next(err)
    }
  })

  // ==== DELETE

  app.delete('/survey/:surveyId/nodeDef/:nodeDefUuid', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const { user } = req
      const nodeDefUuid = Request.getRestParam(req, 'nodeDefUuid')
      const surveyId = Request.getRestParam(req, 'surveyId')

      await NodeDefService.markNodeDefDeleted(user, surveyId, nodeDefUuid)

      await sendRespNodeDefs(res, surveyId)

    } catch (err) {
      next(err)
    }
  })
}
