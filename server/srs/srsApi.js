const {getRestParam} = require('../serverUtils/request')

const SrsManager = require('./srsManager')

module.exports.init = app => {
  // ==== READ
  app.get('/srs/find', async (req, res) => {
    const codeOrName = getRestParam(req, 'codeOrName')

    const srss = await SrsManager.find(codeOrName)

    res.json({srss})
  })
}
