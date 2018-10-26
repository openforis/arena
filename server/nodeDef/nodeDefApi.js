const {sendErr, sendOk} = require('../serverUtils/response')
const {
  getRestParam,
  getBoolParam,
} = require('../serverUtils/request')

const {
  validateNodeDef,
} = require('./nodeDefValidator')

const {
  createNodeDef,

  fetchNodeDef,

  updateNodeDefProp,

  markNodeDefDeleted,
} = require('./nodeDefRepository')

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

  app.get('/nodeDef/:id/validation', async (req, res) => {
    try {
      const nodeDefId = getRestParam(req, 'id')
      const nodeDef = await fetchNodeDef(nodeDefId, true)
      const validation = await validateNodeDef(nodeDef)

      res.json({validation})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== UPDATE

  app.put('/nodeDef/:id/prop', async (req, res) => {
    try {
      const {body} = req
      const nodeDefId = getRestParam(req, 'id')

      const nodeDef = await updateNodeDefProp(nodeDefId, body)
      const validation = await validateNodeDef(nodeDef)

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
