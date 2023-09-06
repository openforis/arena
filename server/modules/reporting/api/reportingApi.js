import * as A from '@core/arena'
import * as Request from '@server/utils/request'
import * as SurveyRdbService from '@server/modules/surveyRdb/service/surveyRdbService'
import { requireRecordListViewPermission } from '../../auth/authApiMiddleware'
import { Query } from '../../../../common/model/query'

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

      const chartSpec = A.parse(chart)

      let query = A.parse(queryParam)
      console.log('Initial query:', query) // Log initial query

      const limit = chartSpec.chartType === 'scatterPlot' ? 10000 : null

      // Modify the query to include aggregation if chartType is barChart
      if (chartSpec.chartType === 'barChart' && chartSpec.query && chartSpec.query.metric && chartSpec.query.groupBy) {
        const groupByFieldUuid = chartSpec.query.groupBy.field_uuid
        const metricFieldUuid = chartSpec.query.metric.field_uuid
        const aggregateFunction = chartSpec.query.metric.aggregate
        const mode = 'aggregate'

        query = Query.assocDimensions([groupByFieldUuid])(query)

        // Convert measures to a Map object before passing it to Query.assocMeasures
        const measures = new Map(
          Object.entries({
            [metricFieldUuid]: [aggregateFunction],
          })
        )
        console.log('measures:', measures) // Log measures as a Map object
        console.log('aggregateFunction:', aggregateFunction)
        console.log('metricFieldUuid:', metricFieldUuid)
        query = Query.assocMeasures(measures)(query)

        query = Query.assocMode(mode)(query)
        query = A.stringify(query)
        console.log('string query', query)
      }

      console.log('Modified query:', query) // Log modified query

      const data = await SurveyRdbService.fetchViewData({ user, surveyId, cycle, query, limit })
      console.log('Data stats: Number of items =', data.length, ', Number of columns =', Object.keys(data[0]).length) // Log stats of the data

      const chartResult = await generateChart({ chartSpec, data })
      res.json({ chartResult })
    } catch (error) {
      console.error('Error:', error)
      next(error)
    }
  })
}
