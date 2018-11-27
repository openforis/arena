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

const checkSurveyId = async (nodeDefId, reqSurveyId) => {
  const nodeDefSurveyId = await fetchNodeDefSurveyId(nodeDefId)
  if (nodeDefSurveyId !== reqSurveyId) {
    throw new UnauthorizedError(`Not authorized`)
  }
}

module.exports.init = app => {

  // ==== CREATE

  app.post('/survey/:surveyId/nodeDef', requireSurveyEditPermission, async (req, res) => {
    try {
      const {body: nodeDefRequest} = req
      const {surveyId, parentId, uuid, type, props} = nodeDefRequest

      const nodeDef = await createNodeDef(surveyId, parentId, uuid, type, props)

      res.json({nodeDef})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== READ

  // ==== UPDATE

  app.put('/survey/:surveyId/nodeDef/:nodeDefId/prop', requireSurveyEditPermission, async (req, res) => {
    try {
      const {body} = req
      const {key, value, advanced} = body

      const nodeDefId = getRestParam(req, 'nodeDefId')
      const surveyId = getRestParam(req, 'surveyId')

      await checkSurveyId(nodeDefId, surveyId)

      await updateNodeDefProp(nodeDefId, key, value, advanced)
      const nodeDefs = await SurveyManager.fetchSurveyNodeDefs(surveyId, true, true)

      res.json({nodeDefs})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== DELETE

  app.delete('/survey/:surveyId/nodeDef/:nodeDefId', requireSurveyEditPermission, async (req, res) => {
    try {
      const nodeDefId = getRestParam(req, 'nodeDefId')
      const surveyId = getRestParam(req, 'surveyId')

      await checkSurveyId(nodeDefId, surveyId)

      await markNodeDefDeleted(nodeDefId)

      sendOk(res)
    } catch (e) {
      sendErr(res, e)
    }
  })
}
