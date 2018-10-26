const {sendErr, sendOk} = require('../serverUtils/response')
const {getRestParam} = require('../serverUtils/request')

const {
  validateNodeDef,
} = require('./nodeDefValidator')

const {
  createNodeDef,
  updateNodeDefProp,
  markNodeDefDeleted,
} = require('./nodeDefRepository')

const {fetchSurveyNodeDefs} = require('./../survey/surveyManager')

module.exports.init = app => {

  // ==== CREATE

  app.post('/nodeDef', async (req, res) => {
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

  app.put('/nodeDef/:id/prop', async (req, res) => {
    try {
      const {body} = req
      const nodeDefId = getRestParam(req, 'id')

      const nodeDef = await updateNodeDefProp(nodeDefId, body)
      const nodeDefs = await fetchSurveyNodeDefs(nodeDef.surveyId, true, false)
      const validation = await validateNodeDef(nodeDefs, nodeDef)

      res.json({validation})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== DELETE

  app.delete('/nodeDef/:id', async (req, res) => {
    try {
      const nodeDefId = getRestParam(req, 'id')

      await markNodeDefDeleted(nodeDefId)

      sendOk(res)
    } catch (e) {
      sendErr(res, e)
    }
  })
}
