import * as Request from '@server/utils/request'

import * as GeoUtils from '@core/geo/geoUtils'

export const init = app => {
  // ==== READ
  app.get('/geo/srs/find', async (req, res) => {
    const { codeOrName } = Request.getParams(req)

    const srss = await GeoUtils.findSrsByCodeOrName(codeOrName)

    res.json({ srss })
  })
};

