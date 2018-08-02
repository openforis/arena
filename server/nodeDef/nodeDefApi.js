const {getRestParam} = require('../serverUtils/request')
const {sendOk, sendErr} = require('../serverUtils/response')

const {fetchNodeDefAndChildren, createNodeDef} = require('./nodeDefRepository')

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

  // ==== READ
  app.get('/nodeDef/:id', async (req, res) => {
    try {
      const nodeDefId = getRestParam(req, 'id')
      const draft = getRestParam(req, 'draft')

      const nodeDefs = await fetchNodeDefAndChildren(nodeDefId, draft)
      res.json({nodeDefs})

    } catch (err) {
      sendErr(res, err)
    }

  })

  // ==== UPDATE

  // ==== DELETE

}
