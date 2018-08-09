const {getRestParam} = require('../serverUtils/request')
const {sendOk, sendErr, sendValidationError} = require('../serverUtils/response')
const { validateNodeDefPropUpdate } = require('./nodeDefValidator')

const {
  fetchNodeDefsByParentId,
  createNodeDef,
  updateNodeDefProp
} = require('./nodeDefRepository')

module.exports.init = app => {

  app.post('/nodeDef', async (req, res) => {
    try {
      const {user, body: nodeDefRequest} = req
      const {surveyId, parentId, uuid, type, props} = nodeDefRequest

      const nodeDef = await createNodeDef(surveyId, parentId, uuid, type, props)

      res.json({nodeDef})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get('/nodeDef/:id/children', async (req, res) => {
    try {
      const nodeDefId = getRestParam(req, 'id')
      const draft = getRestParam(req, 'draft')

      const nodeDefs = await fetchNodeDefsByParentId(nodeDefId, draft)
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
      const validation = await validateNodeDefPropUpdate(nodeDefId, key, value)

      if (validation === null || validation.valid) {
        await updateNodeDefProp(nodeDefId, body)
        sendOk(res)
      } else {
        sendValidationError(res, validation)
      }
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== DELETE

}
