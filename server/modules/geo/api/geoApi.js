const Request = require('../../../utils/request')

const GeoService = require('../service/geoService')

module.exports.init = app => {
  // ==== READ
  app.get('/geo/srs/find', async (req, res) => {
    const { codeOrName } = Request.getParams(req)

    const srss = await GeoService.findSrsByCodeOrName(codeOrName)

    res.json({ srss })
  })
}
