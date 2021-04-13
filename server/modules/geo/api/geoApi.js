import { SRSs } from '@openforis/arena-core'

import * as Request from '@server/utils/request'

export const init = (app) => {
  // ==== READ
  app.get('/geo/srs/find', async (req, res) => {
    const { codeOrName } = Request.getParams(req)

    const srss = SRSs.findSRSByCodeOrName(codeOrName)

    res.json({ srss })
  })
}
