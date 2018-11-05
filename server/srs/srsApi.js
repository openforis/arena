const {
  getRestParam,
  getJsonParam,
} = require('../serverUtils/request')
const {toIndexedObj} = require('../../common/survey/surveyUtils')

const SrsManager = require('./srsManager')

module.exports.init = app => {
  // ==== READ
  app.get('/srs/find', async (req, res) => {
    const codeOrName = getRestParam(req, 'codeOrName')

    const srss = await SrsManager.find(codeOrName)

    res.json({srss})
  })

  app.get('/srs', async (req, res) => {
    const codes = getJsonParam(req, 'codes')

    const srss = await SrsManager.fetchByCodes(codes)

    res.json({srss: toIndexedObj(srss, 'key')})
  })
}
