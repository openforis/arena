const Request = require('../../../utils/request')

const GeoUtils = require('../../../../common/geo/geoUtils')

module.exports.init = app => {
  // ==== READ
  app.get('/geo/srs/find', async (req, res) => {
    const { codeOrName } = Request.getParams(req)

    const srss = await GeoUtils.findSrsByCodeOrName(codeOrName)

    res.json({ srss })
  })
}
