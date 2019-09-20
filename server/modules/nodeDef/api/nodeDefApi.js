const Request = require('../../../utils/request')
const AuthMiddleware = require('../../auth/authApiMiddleware')

const Survey = require('../../../../common/survey/survey')

const SurveyService = require('../../survey/service/surveyService')
const NodeDefService = require('../service/nodeDefService')

const sendRespNodeDefs = async (res, surveyId, sendNodeDefs = false, draft = true, advanced = true, validate = true) => {
  const survey = await SurveyService.fetchSurveyAndNodeDefsBySurveyId(surveyId, draft, advanced, validate)

  res.json({
    nodeDefs: sendNodeDefs ? Survey.getNodeDefs(survey) : null,
    nodeDefsValidation: Survey.getNodeDefsValidation(survey)
  })
}

module.exports.init = app => {

  // ==== CREATE

  app.post('/survey/:surveyId/nodeDef', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const nodeDefRequest = Request.getBody(req)
      const { surveyId } = Request.getParams(req)
      const user = Request.getUser(req)

      await NodeDefService.insertNodeDef(user, surveyId, nodeDefRequest)

      await sendRespNodeDefs(res, surveyId)

    } catch (err) {
      next(err)
    }
  })

  // ==== READ

  app.get(`/survey/:surveyId/nodeDefs`, AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, draft, validate } = Request.getParams(req)
      const advanced = true // always fetch advanced props (TODO fetch only what is needed- now in dataentry min/max count are needed)
      const sendNodeDefs = true

      await sendRespNodeDefs(res, surveyId, sendNodeDefs, draft, advanced, validate)

    } catch (err) {
      next(err)
    }
  })

  // ==== UPDATE

  app.put('/survey/:surveyId/nodeDef/:nodeDefUuid/props', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { props, propsAdvanced } = Request.getBody(req)
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
      const user = Request.getUser(req)
      const { nodeDefUuid, surveyId } = Request.getParams(req)

      await NodeDefService.markNodeDefDeleted(user, surveyId, nodeDefUuid)

      await sendRespNodeDefs(res, surveyId)

    } catch (err) {
      next(err)
    }
  })
}
