const {getRestParam} = require('../serverUtils/request')
const {sendErr} = require('../serverUtils/response')
const {validateNodeDef, validateNodeDefs, validateNodeDefProp} = require('./nodeDefValidator')

const {
  fetchNodeDef,
  fetchNodeDefsByParentId,
  createNodeDef,
  updateNodeDefProp,
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
      const draft = getRestParam(req, 'draft') === 'true'
      const validate = getRestParam(req, 'validate') === 'true'

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
      const validation = await validateNodeDef(nodeDef, false)
      res.json({validation})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== UPDATE

  app.put('/nodeDef/:id/prop', async (req, res) => {
    const {body} = req
    const {key} = body

    const nodeDefId = getRestParam(req, 'id')

    try {
      const nodeDef = await updateNodeDefProp(nodeDefId, body)
      const validation = await validateNodeDefProp(nodeDef, key)
      res.json({validation})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== DELETE

}
