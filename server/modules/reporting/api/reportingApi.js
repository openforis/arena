import * as A from '@core/arena'

import * as Request from '@server/utils/request'

import * as SurveyRdbService from '@server/modules/surveyRdb/service/surveyRdbService'

import { requireRecordListViewPermission } from '../../auth/authApiMiddleware'

const vega = require('vega')
const vegaLite = require('vega-lite')

const generateSvgChart = async ({ chartSpec, data }) => {
  const spec = {
    ...chartSpec,
    data: {
      name: 'table',
      values: data,
    },
  }

  let vegaspec = vegaLite.compile(spec).spec
  const view = new vega.View(vega.parse(vegaspec), { renderer: 'none' })
  const svg = await view.toSVG()
  return svg
}

export const init = (app) => {
  app.post('/reporting/:surveyId/:nodeDefUuidTable/chart', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, query: queryParam, chart } = Request.getParams(req)
      const user = Request.getUser(req)

      const query = A.parse(queryParam)
      const data = await SurveyRdbService.fetchViewData({ user, surveyId, cycle, query })

      const chartSpec = A.parse(chart)
      const svg = await generateSvgChart({ chartSpec, data })

      res.json({ svg })
    } catch (error) {
      next(error)
    }
  })
}
