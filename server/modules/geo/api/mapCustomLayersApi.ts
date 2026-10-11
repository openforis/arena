import type { Request as ExpressRequest, RequestHandler, Response as ExpressResponse, Router } from 'express'

import type { MapCustomLayerScope } from '@core/map/customLayers/mapCustomLayer'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'
import { MapCapabilitiesService } from '@server/modules/geo/service/mapCapabilitiesService'
import { MapCustomLayersService } from '@server/modules/geo/service/mapCustomLayersService'
import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'

type Handler = (req: ExpressRequest, res: ExpressResponse) => Promise<void>

const uriPrefix = '/survey/:surveyId/geo/map/'

/**
 * Wraps an async route handler and answers errors with sendErr (the error middleware runs before these routes, so next(error) would end as a bare 500).
 * @param {Handler} handler - The handler.
 * @returns {Function} The Express handler.
 */
const handle =
  (handler: Handler) =>
  async (req: ExpressRequest, res: ExpressResponse): Promise<void> => {
    try {
      await handler(req, res)
    } catch (error) {
      Response.sendErr(res, error)
    }
  }

/**
 * Reads the survey id and the user uuid of a request.
 * @param {ExpressRequest} req - The request.
 * @returns {{surveyId: number, userUuid: string}} The ids.
 */
const getSurveyAndUser = (req: ExpressRequest): { surveyId: number; userUuid: string } => {
  const { surveyId } = Request.getParams(req)
  return { surveyId: Number(surveyId), userUuid: Request.getUserUuid(req) }
}

/**
 * Registers the routes adding and removing the layers of one scope.
 * @param {object} params - Parameters.
 * @param {Router} params.app - The router.
 * @param {MapCustomLayerScope} params.scope - The scope.
 * @param {RequestHandler} params.permission - The middleware checking who may change that scope.
 * @returns {void}
 */
const initScopeRoutes = ({
  app,
  scope,
  permission,
}: {
  app: Router
  scope: MapCustomLayerScope
  permission: RequestHandler
}): void => {
  app.post(
    `${uriPrefix}custom-layers/${scope}`,
    permission,
    handle(async (req, res) => {
      const { layers } = Request.getBody(req) ?? {}
      const result = await MapCustomLayersService.addMapCustomLayers({ ...getSurveyAndUser(req), scope, layers })
      res.json({ layers: result })
    })
  )

  app.delete(
    `${uriPrefix}custom-layers/${scope}/:layerId`,
    permission,
    handle(async (req, res) => {
      const { layerId } = Request.getParams(req)
      const result = await MapCustomLayersService.removeMapCustomLayer({
        ...getSurveyAndUser(req),
        scope,
        layerId: String(layerId),
      })
      res.json({ layers: result })
    })
  )
}

/**
 * Registers the custom map layer routes: the capabilities proxy and the layer storage.
 * @param {Router} app - The API router.
 * @returns {void}
 */
export const init = (app: Router): void => {
  app.get(
    `${uriPrefix}capabilities`,
    AuthMiddleware.requireMapUsePermission,
    handle(async (req, res) => {
      const { url } = Request.getParams(req)
      res.json(await MapCapabilitiesService.fetchCapabilities(url))
    })
  )

  app.get(
    `${uriPrefix}custom-layers`,
    AuthMiddleware.requireMapUsePermission,
    handle(async (req, res) => {
      res.json(await MapCustomLayersService.fetchMapCustomLayers(getSurveyAndUser(req)))
    })
  )

  initScopeRoutes({ app, scope: 'survey', permission: AuthMiddleware.requireSurveyEditPermission })
  initScopeRoutes({ app, scope: 'user', permission: AuthMiddleware.requireMapUsePermission })
}
