import express from 'express';
import bodyParser from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';
import Log from '../log/log';
import * as headerMiddleware from './middleware/headerMiddleware';
import jwtMiddleware from './middleware/jwtMiddleware';
import * as errorMiddleware from './middleware/errorMiddleware';
import * as authApi from '../modules/auth/api/authApi';
import apiRouter from './apiRouter';
import WebSocket from '../utils/webSocket';
import RecordPreviewCleanup from './schedulers/recordPreviewCleanup';
import ExpiredJwtTokensCleanup from './schedulers/expiredJwtTokensCleanup';
import TempFilesCleanup from './schedulers/tempFilesCleanup';
import ProcessUtils from '../../core/processUtils';

export default async () => {
  const logger = Log.getLogger('AppCluster')

  logger.info(`server initialization start`)

  const app = express()

  // ====== app initializations
  app.use(bodyParser.json({ limit: '5000kb' }))
  app.use(cookieParser())
  app.use(fileUpload({
    // limit upload to 1 GB
    limits: { fileSize: 1024 * 1024 * 1024 },
    abortOnLimit: true,
    useTempFiles: true,
    tempFileDir: ProcessUtils.ENV.tempFolder,
  }))

  headerMiddleware.init(app)

  app.use(/^\/api.*|^\/auth.*/, jwtMiddleware)

  app.use(compression({ threshold: 512 }))

  app.use(/^\/$/, (req, res) => res.redirect('/app/home'))

  app.use('/', express.static(`${__dirname}/../../dist`))
  app.use('/app*', express.static(`${__dirname}/../../dist`))
  app.use('/img/', express.static(`${__dirname}/../../web-resources/img`))
  // app.use('/css/', express.static(`${__dirname}/../web-resources/css`))

  // ====== apis
  authApi.init(app)
  app.use('/api', apiRouter.router)

  // ====== error handling
  errorMiddleware.init(app)

  // ====== server
  const server = app.listen(ProcessUtils.ENV.port, () => {
    logger.info(`server initialization end - listening on port ${ProcessUtils.ENV.port}`)
  })

  // ====== socket middleware
  WebSocket.init(server, jwtMiddleware)

  // ====== schedulers
  await RecordPreviewCleanup.init()
  await ExpiredJwtTokensCleanup.init()
  await TempFilesCleanup.init()
};
