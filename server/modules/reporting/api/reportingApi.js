import * as A from '@core/arena'
import * as Request from '@server/utils/request'
import * as SurveyRdbService from '@server/modules/surveyRdb/service/surveyRdbService'
import { requireRecordListViewPermission } from '../../auth/authApiMiddleware'

const vega = require('vega')
const vegaLite = require('vega-lite')

const generateChart = async ({ chartSpec, data }) => {
  if (chartSpec.chartType === 'scatterPlot' || chartSpec.chartType === 'barChart') {
    // return raw data if scatterPlot is requested
    return data
  } else {
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
}

export const init = (app) => {
  app.post('/reporting/:surveyId/:nodeDefUuidTable/chart', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, query: queryParam, chart } = Request.getParams(req)
      const user = Request.getUser(req)

      const query = A.parse(queryParam)
      const data = await SurveyRdbService.fetchViewData({ user, surveyId, cycle, query })
      const limit = chartSpec.chartType === 'scatterPlot' ? 10000 : null
      const data = await SurveyRdbService.fetchViewData({ user, surveyId, cycle, query, limit })

      const chartSpec = A.parse(chart)
      const chartResult = await generateChart({ chartSpec, data })

      res.json({ chartResult })
    } catch (error) {
      next(error)
    }
  })
}
