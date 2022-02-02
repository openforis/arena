import { createProxyMiddleware } from 'http-proxy-middleware'

import { SRSs } from '@openforis/arena-core'

import * as User from '@core/user/user'
import * as Request from '@server/utils/request'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'

const mapRouter = (req) => {
  const { provider, period, x, y, z } = Request.getParams(req)
  const user = Request.getUser(req)
  const apiKey = User.getMapApiKey({ provider })(user)

  if (provider === 'planet') {
    return `https://tiles.planet.com/basemaps/v1/planet-tiles/global_monthly_${period}_mosaic/gmap/${z}/${x}/${y}.png?api_key=${apiKey}`
  }
  return null
}

export const init = (app) => {
  // ==== READ
  app.get('/geo/srs/find', async (req, res) => {
    const { codeOrName } = Request.getParams(req)

    const srss = SRSs.findSRSByCodeOrName(codeOrName)

    res.json({ srss })
  })

  app.get('/geo/map/:provider/tile/:z/:y/:x', AuthMiddleware.requireMapUsePermission, async (req, res) => {
    const { provider, period, x, y, z } = Request.getParams(req)
    const user = Request.getUser(req)
    const apiKey = User.getMapApiKey({ provider })(user)

    if (provider === 'planet') {
      res.forward(
        `https://tiles.planet.com/basemaps/v1/planet-tiles/global_monthly_${period}_mosaic/gmap/${z}/${x}/${y}.png?api_key=${apiKey}`
      )
    }
  })
}
