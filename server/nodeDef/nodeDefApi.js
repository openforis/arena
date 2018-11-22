const {sendErr, sendOk} = require('../serverUtils/response')
const {getRestParam} = require('../serverUtils/request')
const {
  requireNodeDefPropEditPermission,
  requireNodeDefEditPermission
} = require('../authGroup/authMiddleware')

const {
  createNodeDef,
  updateNodeDefProp,
  markNodeDefDeleted,
} = require('./nodeDefManager')

const {fetchSurveyNodeDefs} = require('./../survey/surveyManager')

module.exports.init = app => {

  // ==== CREATE

  app.post('/nodeDef', requireNodeDefEditPermission, async (req, res) => {
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

  app.put('/nodeDef/:nodeDefId/prop', requireNodeDefPropEditPermission, async (req, res) => {
    try {
      const {body} = req
      const {key, value} = body
      const nodeDefId = getRestParam(req, 'nodeDefId')

      const nodeDef = await updateNodeDefProp(nodeDefId, key, value)
      const nodeDefs = await fetchSurveyNodeDefs(nodeDef.surveyId, true, true)

      res.json({nodeDefs})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== DELETE

  app.delete('/nodeDef/:nodeDefId', requireNodeDefPropEditPermission, async (req, res) => {
    try {
      const nodeDefId = getRestParam(req, 'nodeDefId')

      await markNodeDefDeleted(nodeDefId)

      sendOk(res)
    } catch (e) {
      sendErr(res, e)
    }
  })
}
