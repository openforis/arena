const {sendErr, sendOk} = require('../serverUtils/response')
const {getRestParam} = require('../serverUtils/request')

const {requireSurveyEditPermission} = require('../authGroup/authMiddleware')

const {
  createNodeDef,
  updateNodeDefProp,
  markNodeDefDeleted,
  fetchNodeDefSurveyId,
} = require('./nodeDefManager')

const SurveyManager = require('./../survey/surveyManager')

const UnauthorizedError = require('../authGroup/unauthorizedError')

const checkSurveyId = async (nodeDefUuid, reqSurveyId) => {
  const nodeDefSurveyId = await fetchNodeDefSurveyId(nodeDefUuid)
  if (nodeDefSurveyId !== reqSurveyId) {
    throw new UnauthorizedError(`Not authorized`)
  }
}

module.exports.init = app => {

  // ==== CREATE

  app.post('/survey/:surveyId/nodeDef', requireSurveyEditPermission, async (req, res) => {
    try {
      const {body: nodeDefRequest} = req
      const {surveyId, parentUuid, uuid, type, props} = nodeDefRequest

      const nodeDef = await createNodeDef(surveyId, parentUuid, uuid, type, props)

      res.json({nodeDef})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== READ

  // ==== UPDATE

  app.put('/survey/:surveyId/nodeDef/:nodeDefUuid/prop', requireSurveyEditPermission, async (req, res) => {
    try {
      const {body} = req
      const {key, value, advanced} = body

      const nodeDefUuid = getRestParam(req, 'nodeDefUuid')
      const surveyId = getRestParam(req, 'surveyId')

      await checkSurveyId(nodeDefUuid, surveyId)

      await updateNodeDefProp(nodeDefUuid, key, value, advanced)
      const nodeDefs = await SurveyManager.fetchSurveyNodeDefs(surveyId, true, true)

      res.json({nodeDefs})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== DELETE

  app.delete('/survey/:surveyId/nodeDef/:nodeDefUuid', requireSurveyEditPermission, async (req, res) => {
    try {
      const nodeDefUuid = getRestParam(req, 'nodeDefUuid')
      const surveyId = getRestParam(req, 'surveyId')

      await checkSurveyId(nodeDefUuid, surveyId)

      await markNodeDefDeleted(nodeDefUuid)

      sendOk(res)
    } catch (e) {
      sendErr(res, e)
    }
  })
}
