const {getRestParam} = require('../serverUtils/request')
const {sendOk, sendErr} = require('../serverUtils/response')
const {validateNodeDef, validateNodeDefs, validateNodeDefProp} = require('./nodeDefValidator')

const {
  fetchNodeDef,
  fetchNodeDefsByParentId,
  createNodeDef,
  updateNodeDefProp,
} = require('./nodeDefRepository')

module.exports.init = app => {

  app.post('/nodeDef', async (req, res) => {
    try {
      const {user, body: nodeDefRequest} = req
      const {surveyId, parentId, uuid, type, props} = nodeDefRequest

      const nodeDefDB = await createNodeDef(surveyId, parentId, uuid, type, props)
      const nodeDef = {
        ...nodeDefDB,
        validation: await validateNodeDef(nodeDefDB)
      }
      res.json({nodeDef})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get('/nodeDef/:id/children', async (req, res) => {
    try {
      const nodeDefId = getRestParam(req, 'id')
      const draft = getRestParam(req, 'draft')

      const nodeDefsDB = await fetchNodeDefsByParentId(nodeDefId, draft)
      const nodeDefs = await validateNodeDefs(nodeDefsDB)

      res.json({nodeDefs})
    } catch (err) {
      sendErr(res, err)
    }

  })

  // ==== UPDATE

  app.put('/nodeDef/:id/prop', async (req, res) => {
    const {user, body} = req

    const {key, value} = body

    const nodeDefId = getRestParam(req, 'id')

    try {
      const nodeDef = await updateNodeDefProp(nodeDefId, body)
      const validation = await validateNodeDefProp(nodeDef, key, false)
      res.json({validation})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== DELETE

}
