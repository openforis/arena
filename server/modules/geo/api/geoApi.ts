import Request from '../../../utils/request';
import GeoUtils from '../../../../core/geo/geoUtils';
import express from 'express';

export const init = app => {
  // ==== READ
  app.get('/geo/srs/find', async (req: express.Request, res: express.Response) => {
    const { codeOrName } = Request.getParams(req)

    const srss = await GeoUtils.findSrsByCodeOrName(codeOrName)

    res.json({ srss })
  })
};
