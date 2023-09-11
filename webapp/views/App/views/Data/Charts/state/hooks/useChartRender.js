import { useCallback, useState, useEffect } from 'react'
import axios from 'axios'
import * as A from '@core/arena'

import { Query } from '@common/model/query'
import { useSurveyId, useSurveyCycleKey } from '@webapp/store/survey'

const getUrl = ({ surveyId, query }) => `/api/reporting/${surveyId}/${Query.getEntityDefUuid(query)}/chart`

const useChartRender = (spec, query) => {
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()

  const [chartData, setChartData] = useState(null)

  const renderChart = useCallback(async () => {
    try {
      if (!query) return
      setChartData(null)

      const apiUrl = getUrl({ surveyId, query })
      const { data } = await axios.post(apiUrl, {
        cycle,
        query: A.stringify(query),
        chart: A.stringify(spec),
      })

      setChartData(data)
    } catch (err) {
      console.error('Error occurred:', err.response ? err.response.data : err.message)
    }
  }, [spec, surveyId, cycle])

  // Call renderChart only when necessary data is available
  useEffect(() => {
    if (spec.chartType === 'barChart' ? spec.metric && spec.query && spec.query.groupBy : spec.metric) {
      renderChart()
    }
  }, [spec, renderChart])

  return {
    chartData,
    renderChart,
  }
}

export default useChartRender
