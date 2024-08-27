import axios from 'axios'
import xmljs from 'xml-js'

import { Objects, Promises } from '@openforis/arena-core'

import { MapUtils } from '@core/map/mapUtils'

import * as Request from '@server/utils/request'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'
import * as SrsManager from '@server/modules/geo/manager/srsManager'

import { PlanetApi } from './planetApi'

const uriPrefix = '/survey/:surveyId/geo/'
const whispApiUrl = 'https://whisp.openforis.org/api/'

// free altitude API urls
const altitudeApiUrls = [
  ({ lat, lng }) => `https://api.opentopodata.org/v1/aster30m?locations=${lat},${lng}`,
  ({ lat, lng }) => `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`,
]

const getMapTileForwardUrl = (req) => {
  const { provider, period, x, y, z, proc } = Request.getParams(req)
  const apiKey = MapUtils.mapApiKeyByProvider[provider]

  return MapUtils.getMapTileUrl({ provider, x, y, z, period, apiKey, proc })
}

export const init = (app) => {
  // ==== READ
  app.get(`${uriPrefix}srs/find`, AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { codeOrName } = Request.getParams(req)

      const srss = await SrsManager.findSRSByCodeOrName(codeOrName)

      res.json({ srss })
    } catch (error) {
      next(error)
    }
  })

  app.get(
    `${uriPrefix}map/:provider/tile/:z/:y/:x`,
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
    `${uriPrefix}map/:provider/available_montly_periods`,
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

  app.get(`${uriPrefix}map/altitude`, AuthMiddleware.requireMapUsePermission, async (req, res) => {
    const { lat, lng } = Request.getParams(req)
    let altitude = null
    await Promises.each(altitudeApiUrls, async (urlPattern) => {
      if (!Objects.isEmpty(altitude)) return
      try {
        const url = urlPattern({ lat, lng })
        const { data } = await axios.get(url, { timeout: 10000 })
        altitude = data?.results?.[0]?.elevation
      } catch (error) {
        // ignore it
      }
    })
    res.json(altitude)
  })

  app.get(`${uriPrefix}map/wmts/capabilities`, AuthMiddleware.requireMapUsePermission, async (req, res, next) => {
    const { url } = Request.getParams(req)
    try {
      const { data } = await axios.get(url)
      const jsonstring = xmljs.xml2json(data, { compact: true, spaces: 4 })
      const json = JSON.parse(jsonstring)
      res.json(json)
    } catch (error) {
      next(error)
    }
  })

  app.post(`${uriPrefix}whisp/geojson`, AuthMiddleware.requireMapUsePermission, async (req, res, next) => {
    const geojson = Request.getBody(req)
    const url = `${whispApiUrl}geojson`
    try {
      const {
        data: { token },
      } = await axios.post(url, geojson)
      res.json(token)
    } catch (error) {
      next(error)
    }
  })
}
