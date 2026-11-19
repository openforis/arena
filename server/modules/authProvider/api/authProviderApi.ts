import type { User as ArenaUser } from '@openforis/arena-core'
import type { Router } from 'express'

import * as User from '@core/user/user'

import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'
import * as FileUtils from '@server/utils/file/fileUtils'
import UnauthorizedError from '@server/utils/unauthorizedError'

import * as AuthMiddleware from '../../auth/authApiMiddleware'
import * as AuthProviderAdminService from '../service/authProviderAdminService'
import * as UserSignInMethodsService from '../service/userSignInMethodsService'

const basePath = '/admin/auth-providers'

// errors of the arena-server services (ServerError: key, params, statusCode) are sent as JSON so the client can
// translate them; the other errors go to the default handlers
const handleError = (error: any, res, next) => {
  if (error?.name === 'ServerError' && error.key && !res.headersSent) {
    res.status(error.statusCode ?? 500).json({ status: 'error', key: error.key, params: error.params })
  } else {
    next(error)
  }
}

// only the user themself or a system admin can see and change their sign-in methods
const checkCanManageSignInMethods = (req): { user: ArenaUser; userUuid: string } => {
  const user = Request.getUser(req)
  const { userUuid } = Request.getParams(req)
  if (User.getUuid(user) !== userUuid && !User.isSystemAdmin(user)) {
    throw new UnauthorizedError(User.getName(user))
  }
  return { user, userUuid }
}

const initAdminApi = (app: Router) => {
  app.get(basePath, AuthMiddleware.requireAdminPermission, async (req, res, next) => {
    try {
      res.json(await AuthProviderAdminService.fetchProviders({ baseUrl: Request.getPublicServerUrl(req) }))
    } catch (error) {
      handleError(error, res, next)
    }
  })

  app.post(basePath, AuthMiddleware.requireAdminPermission, async (req, res, next) => {
    try {
      const { id, type, props = {}, clientSecret } = Request.getBody(req) ?? {}
      const user = Request.getUser(req)
      res.json(await AuthProviderAdminService.createProvider({ user, input: { id, type, props, clientSecret } }))
    } catch (error) {
      handleError(error, res, next)
    }
  })

  // registered before the ":id" routes
  app.put(`${basePath}/order`, AuthMiddleware.requireAdminPermission, async (req, res, next) => {
    try {
      const { ids = [] } = Request.getBody(req) ?? {}
      await AuthProviderAdminService.reorderProviders({ user: Request.getUser(req), ids })
      Response.sendOk(res)
    } catch (error) {
      handleError(error, res, next)
    }
  })

  app.get(`${basePath}/:id`, AuthMiddleware.requireAdminPermission, async (req, res, next) => {
    try {
      const { id } = Request.getParams(req)
      const provider = await AuthProviderAdminService.fetchProvider({ id, baseUrl: Request.getPublicServerUrl(req) })
      if (provider) {
        res.json(provider)
      } else {
        res.status(404).json({ message: 'appErrors.authProvider.notFound' })
      }
    } catch (error) {
      handleError(error, res, next)
    }
  })

  app.put(`${basePath}/:id`, AuthMiddleware.requireAdminPermission, async (req, res, next) => {
    try {
      const { id } = Request.getParams(req)
      const { props = {}, clientSecret } = Request.getBody(req) ?? {}
      const user = Request.getUser(req)
      res.json(await AuthProviderAdminService.updateProvider({ user, id, props, clientSecret }))
    } catch (error) {
      handleError(error, res, next)
    }
  })

  app.delete(`${basePath}/:id`, AuthMiddleware.requireAdminPermission, async (req, res, next) => {
    try {
      const { id, notifyUsers = false } = Request.getParams(req)
      const result = await AuthProviderAdminService.deleteProvider({
        user: Request.getUser(req),
        id,
        notifyUsers,
        serverUrl: Request.getPublicServerUrl(req),
      })
      res.json(result)
    } catch (error) {
      handleError(error, res, next)
    }
  })

  app.get(
    `${basePath}/:id/users-without-other-method`,
    AuthMiddleware.requireAdminPermission,
    async (req, res, next) => {
      try {
        const { id } = Request.getParams(req)
        res.json(await AuthProviderAdminService.fetchUsersWithoutOtherSignInMethod({ id }))
      } catch (error) {
        handleError(error, res, next)
      }
    }
  )

  app.post(`${basePath}/:id/test`, AuthMiddleware.requireAdminPermission, async (req, res, next) => {
    try {
      const { id } = Request.getParams(req)
      res.json(await AuthProviderAdminService.testProviderConnection({ id }))
    } catch (error) {
      handleError(error, res, next)
    }
  })

  app.put(`${basePath}/:id/icon`, AuthMiddleware.requireAdminPermission, async (req, res, next) => {
    try {
      const { id } = Request.getParams(req)
      const file = Request.getFile(req)
      const content = file ? await FileUtils.readBinaryFile(file.tempFilePath) : null
      await AuthProviderAdminService.setProviderIcon({
        user: Request.getUser(req),
        id,
        file: content,
        mime: file?.mimetype ?? null,
      })
      Response.sendOk(res)
    } catch (error) {
      handleError(error, res, next)
    }
  })
}

const initUserApi = (app: Router) => {
  app.get('/user/:userUuid/sign-in-methods', async (req, res, next) => {
    try {
      const { userUuid } = checkCanManageSignInMethods(req)
      res.json(await UserSignInMethodsService.fetchSignInMethods({ userUuid }))
    } catch (error) {
      handleError(error, res, next)
    }
  })

  app.delete('/user/:userUuid/sign-in-methods/:identityId', async (req, res, next) => {
    try {
      const { user, userUuid } = checkCanManageSignInMethods(req)
      const { identityId, allowLastMethod = false } = Request.getParams(req)
      // only a system admin can leave a user without any sign-in method (recovery with "forgot password")
      await UserSignInMethodsService.unlinkIdentity({
        userUuid,
        identityId,
        allowLastMethod: allowLastMethod && User.isSystemAdmin(user),
      })
      Response.sendOk(res)
    } catch (error) {
      handleError(error, res, next)
    }
  })
}

export const init = (app: Router): void => {
  initAdminApi(app)
  initUserApi(app)
}
