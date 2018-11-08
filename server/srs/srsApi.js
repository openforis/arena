const {getRestParam} = require('../serverUtils/request')

const {findSrsByCodeOrName} = require('./srsManager')

module.exports.init = app => {
  // ==== READ
  app.get('/srs/find', async (req, res) => {
    const codeOrName = getRestParam(req, 'codeOrName')

    const srss = await findSrsByCodeOrName(codeOrName)

    res.json({srss})
  })
}
