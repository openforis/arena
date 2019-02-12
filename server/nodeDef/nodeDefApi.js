const { sendErr, sendOk } = require('../serverUtils/response')
const { getRestParam, getBoolParam } = require('../serverUtils/request')

const AuthMiddleware = require('../authGroup/authMiddleware')

const NodeDefManager = require('./nodeDefManager')

module.exports.init = app => {

  const sendRespNodeDefs = async (res, surveyId, draft = true, advanced = true, validate = true) => {
    const nodeDefs = await NodeDefManager.fetchNodeDefsBySurveyId(surveyId, draft, advanced, validate)
    res.json({ nodeDefs })
  }

  // ==== CREATE

  app.post('/survey/:surveyId/nodeDef', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const { body: nodeDefRequest, user } = req
      const { surveyId, parentUuid, uuid, type, props } = nodeDefRequest

      const nodeDef = await NodeDefManager.createNodeDef(user, surveyId, parentUuid, uuid, type, props)

      res.json({ nodeDef })
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== READ

  app.get(`/survey/:surveyId/nodeDefs`, AuthMiddleware.requireSurveyViewPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const draft = getBoolParam(req, 'draft')
      const validate = getBoolParam(req, 'validate')
      const advanced = true // always fetch advanced props (TODO fetch only what is needed- now in dataentry min/max count are needed)

      await sendRespNodeDefs(res, surveyId, draft, advanced, validate)

    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== UPDATE

  app.put('/survey/:surveyId/nodeDef/:nodeDefUuid/props', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const { body, user } = req
      const props = body

      const nodeDefUuid = getRestParam(req, 'nodeDefUuid')
      const surveyId = getRestParam(req, 'surveyId')

      await NodeDefManager.updateNodeDefProps(user, surveyId, nodeDefUuid, props)

      await sendRespNodeDefs(res, surveyId)

    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== DELETE

  app.delete('/survey/:surveyId/nodeDef/:nodeDefUuid', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const { user } = req
      const nodeDefUuid = getRestParam(req, 'nodeDefUuid')
      const surveyId = getRestParam(req, 'surveyId')

      await NodeDefManager.markNodeDefDeleted(user, surveyId, nodeDefUuid)

      await sendRespNodeDefs(res, surveyId)

    } catch (e) {
      sendErr(res, e)
    }
  })
}
