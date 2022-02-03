import { SRSs } from '@openforis/arena-core'

import * as Request from '@server/utils/request'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'
import { MapUtils } from '@core/map/mapUtils'
import { PlanetApi } from './planetApi'

const getMapTileForwardUrl = (req) => {
  const { provider, period, x, y, z } = Request.getParams(req)
  const user = Request.getUser(req)
  const apiKey = MapUtils.mapApiKeyByProvider[provider]

  return MapUtils.getMapTileUrl({ provider, x, y, z, period, apiKey })
}

export const init = (app) => {
  // ==== READ
  app.get('/geo/srs/find', async (req, res) => {
    const { codeOrName } = Request.getParams(req)

    const srss = SRSs.findSRSByCodeOrName(codeOrName)

    res.json({ srss })
  })

  app.get(
    '/geo/map/:provider/tile/:z/:y/:x',
    AuthMiddleware.requireMapUsePermission,
    // createProxyMiddleware({ router: getForwardUrl, changeOrigin: true, secure: false })
    async (req, res, _next) => {
      const url = getMapTileForwardUrl(req)

      res.redirect(url)

      // req.pipe(
      //   https.get(
      //     url,
      //     {
      //       headers: req.headers,
      //       //timeout: 2,
      //       rejectUnauthorized: false,
      //     },
      //     (proxyResponse) => {
      //       proxyResponse.pause()
      //       res.writeHead(proxyResponse.statusCode, proxyResponse.headers)
      //       proxyResponse.pipe(res)
      //       proxyResponse.resume()
      //     }
      //   )
      // )
    }
  )

  app.get('/geo/map/:provider/available_montly_periods', AuthMiddleware.requireMapUsePermission, async (req, res) => {
    const { provider } = Request.getParams(req)
    try {
      if (provider === MapUtils.mapProviders.planet) {
        const periods = await PlanetApi.fetchAvailableMonthlyMosaicsPeriods()
        res.json(periods)
      }
      res.json([])
    } catch (error) {
      next(error)
    }
  })
}
