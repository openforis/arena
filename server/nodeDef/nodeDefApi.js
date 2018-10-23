const {sendErr, sendOk} = require('../serverUtils/response')
const {
  getRestParam,
  getBoolParam,
} = require('../serverUtils/request')

const {
  validateNodeDef,
  validateNodeDefs
} = require('./nodeDefValidator')

const {
  createNodeDef,

  fetchNodeDef,
  fetchNodeDefsByParentId,

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

  app.get('/nodeDef/:id/children', async (req, res) => {
    try {
      const nodeDefId = getRestParam(req, 'id')
      const draft = getBoolParam(req, 'draft')
      const validate = getBoolParam(req, 'validate')

      const nodeDefsDB = await fetchNodeDefsByParentId(nodeDefId, draft)
      const nodeDefs = validate
        ? await validateNodeDefs(nodeDefsDB)
        : nodeDefsDB

      res.json({nodeDefs})
    } catch (err) {
      sendErr(res, err)
    }
  })

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
