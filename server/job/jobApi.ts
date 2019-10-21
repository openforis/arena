import Request from '../utils/request';
import Response from '../utils/response';
import JobManager from './jobManager';

export const init = app => {

  /**
   * ====== DELETE
   */
  app.delete('/jobs/active', async (req, res) => {
    await JobManager.cancelActiveJobByUserUuid(Request.getUserUuid(req))

    Response.sendOk(res)
  })

};
