import axios from 'axios'

import { SRSs } from '@openforis/arena-core'

import * as Request from '@server/utils/request'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'
import { MapUtils } from '@core/map/mapUtils'
import { PlanetApi } from './planetApi'
import xmljs from 'xml-js'

const getMapTileForwardUrl = (req) => {
  const { provider, period, x, y, z, proc } = Request.getParams(req)
  const apiKey = MapUtils.mapApiKeyByProvider[provider]

  return MapUtils.getMapTileUrl({ provider, x, y, z, period, apiKey, proc })
}

export const init = (app) => {
  // ==== READ
  app.get('/survey/:surveyId/geo/srs/find', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { codeOrName } = Request.getParams(req)

      const srss = SRSs.findSRSByCodeOrName(codeOrName)

      res.json({ srss })
    } catch (error) {
      next(error)
    }
  })

  app.get(
    '/survey/:surveyId/geo/map/:provider/tile/:z/:y/:x',
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

  app.get(
    '/survey/:surveyId/geo/map/:provider/available_montly_periods',
    AuthMiddleware.requireMapUsePermission,
    async (req, res, next) => {
      const { provider } = Request.getParams(req)
      try {
        if (provider === MapUtils.mapProviders.planet) {
          const periods = await PlanetApi.fetchAvailableMonthlyMosaicsPeriods()
          res.json(periods)
          return
        }
      } catch (error) {
        next(error)
      } finally {
        // error or provider not supported
        res.json([])
      }
    }
  )

  app.get('/survey/:surveyId/geo/map/elevation', AuthMiddleware.requireMapUsePermission, async (req, res) => {
    try {
      const { lat, lng } = Request.getParams(req)
      const url = `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`
      const { data } = await axios.get(url, { timeout: 10000 })
      const elevation = data?.results?.[0]?.elevation

      res.json(elevation)
    } catch (error) {
      res.json(null)
    }
  })

  app.get(
    '/survey/:surveyId/geo/map/wmts/capabilities',
    AuthMiddleware.requireMapUsePermission,
    async (req, res, next) => {
      const { url } = Request.getParams(req)
      try {
        const { data } = await axios.get(url)
        const jsonstring = xmljs.xml2json(data, { compact: true, spaces: 4 })
        const json = JSON.parse(jsonstring)
        res.json(json)
      } catch (error) {
        next(error)
      }
    }
  )
}
