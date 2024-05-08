import * as A from '@core/arena'
import * as Request from '@server/utils/request'
import * as SurveyRdbService from '@server/modules/surveyRdb/service/surveyRdbService'
import { requireRecordListViewPermission } from '../../auth/authApiMiddleware'
import { Query } from '../../../../common/model/query'
import { D3_CHART_TYPES } from '../../../../webapp/views/App/views/Data/Charts/constants/chartTypes'

const vega = require('vega')
const vegaLite = require('vega-lite')

const generateChart = async ({ chartSpec, data }) => {
  if (D3_CHART_TYPES?.includes(chartSpec.chartType)) {
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

      const chartSpec = A.parse(chart)

      let query = queryParam

      const limit = chartSpec.chartType === 'scatterPlot' ? 10000 : null

      // Modify the query to include aggregation if chartType is barChart
      if (
        chartSpec.chartType === 'barChart' &&
        chartSpec.query &&
        chartSpec.query.metric &&
        chartSpec.query.metric.field !== '' &&
        chartSpec.query.groupBy &&
        chartSpec.query.groupBy.field !== '' &&
        chartSpec.query.aggregation &&
        chartSpec.query.aggregation.type !== ''
      ) {
        const groupByFieldUuid = chartSpec.query.groupBy.field_uuid
        const metricFieldUuid = chartSpec.query.metric.field_uuid
        const aggregateFunction = chartSpec.query.aggregation.type
        const mode = 'aggregate'

        query = Query.assocDimensions([groupByFieldUuid])(query)

        const measures = { [metricFieldUuid]: [aggregateFunction] }

        query = Query.assocMeasures(measures)(query)

        query = Query.assocMode(mode)(query)
      }
      if (Query.hasSelection(query)) {
        const data = await SurveyRdbService.fetchViewData({ user, surveyId, cycle, query, limit })

        const chartResult = await generateChart({ chartSpec, data })
        res.json({ chartResult })
      } else {
        res.json({ chartResult: [] })
      }
    } catch (error) {
      next(error)
    }
  })
}
