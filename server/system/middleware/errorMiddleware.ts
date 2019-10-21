import Response from '../../utils/response';
import Log from '../../log/log';

const logger = Log.getLogger('App error')

export const init = app => {

  app.use((err, req, res, next) => {
    logger.error(err.stack)
    Response.sendErr(res, err)
  })

};
