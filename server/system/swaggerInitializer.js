import swaggerJSDoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

import * as Log from '@server/log/log'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'

const Logger = Log.getLogger('SwaggerInitializer')

const options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Open Foris Arena API',
      version: '0.1.0',
      description: 'This the CRUD API to access and manipulate Open Foris Arena survey data',
      license: {
        name: 'MIT',
        url: 'https://raw.githubusercontent.com/openforis/arena/refs/heads/master/LICENSE',
      },
      contact: {
        name: 'OpenForis',
        url: 'https://www.openforis.org',
      },
    },
  },
  apis: ['./**/*Api.js', './doc/api/*.js'],
}

const specs = swaggerJSDoc(options)

const init = (app) => {
  Logger.debug('initializing swagger UI')
  app.use('/api-docs', AuthMiddleware.requireLoggedInUser, swaggerUi.serve, swaggerUi.setup(specs))
}

export const SwaggerInitializer = { init }
