import axios from 'axios'

import { SRSs } from '@openforis/arena-core'

import * as Request from '@server/utils/request'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'
import { MapUtils } from '@core/map/mapUtils'
import { PlanetApi } from './planetApi'

const getMapTileForwardUrl = (req) => {
  const { provider, period, x, y, z, proc } = Request.getParams(req)
  const apiKey = MapUtils.mapApiKeyByProvider[provider]

  return MapUtils.getMapTileUrl({ provider, x, y, z, period, apiKey, proc })
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
    async (req, res) => {
      try {
        // cache the response for 1 year
        res.set('Cache-Control', 'private, max-age=31536000')
        const url = getMapTileForwardUrl(req)
        const { data: dataStream } = await axios.get(url, { responseType: 'stream' })
        dataStream.pipe(res)
      } catch (error) {
        res.json({})
      }
    }
  )

  app.get('/geo/map/:provider/available_montly_periods', AuthMiddleware.requireMapUsePermission, async (req, res) => {
    const { provider } = Request.getParams(req)
    try {
      if (provider === MapUtils.mapProviders.planet) {
        const periods = await PlanetApi.fetchAvailableMonthlyMosaicsPeriods()
        res.json(periods)
        return
      }
    } catch (error) {
      null
    }

    // error or provider not supported
    res.json([])
  })
}
