import { useCallback, useState } from 'react'
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

      console.log('Received data:', data)
      setChartData(data)
    } catch (err) {
      console.error('Error occurred:', err.response ? err.response.data : err.message)
    }
  }, [spec, surveyId, cycle])

  return {
    chartData,
    renderChart,
  }
}

export default useChartRender
