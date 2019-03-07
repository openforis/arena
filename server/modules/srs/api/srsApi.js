const Request = require('../../../serverUtils/request')

const { findSrsByCodeOrName } = require('../service/srsService')

module.exports.init = app => {
  // ==== READ
  app.get('/srs/find', async (req, res) => {
    const codeOrName = Request.getRestParam(req, 'codeOrName')

    const srss = await findSrsByCodeOrName(codeOrName)

    res.json({ srss })
  })
}
