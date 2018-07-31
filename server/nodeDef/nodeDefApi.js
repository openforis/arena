const {getRestParam} = require('../serverUtils/request')
const {sendOk, sendErr} = require('../serverUtils/response')

const {fetchNodeDef} = require('./nodeDefRepository')

module.exports.init = app => {

  app.get('/nodeDef/:id', async (req, res) => {
    try {

      const nodeDefId = getRestParam(req, 'id')
      const draft = getRestParam(req, 'draft')

      const nodeDef = await fetchNodeDef(nodeDefId, draft)
      res.json({nodeDef})

    } catch (err) {
      sendErr(res, err)
    }

  })

}
