import { useCallback, useState } from 'react'
import axios from 'axios'
import * as A from '@core/arena'

import { Query } from '@common/model/query'
import { useSurveyId, useSurveyCycleKey } from '@webapp/store/survey'

const getUrl = ({ surveyId, query }) => `/api/reporting/${surveyId}/${Query.getEntityDefUuid(query)}/chart`

const useChartRender = (spec, query) => {
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()

  const [chartImage, setChartImage] = useState(null)

  const renderChart = useCallback(async () => {
    try {
      if (!query) return
      const { data } = await axios.post(getUrl({ surveyId, query }), {
        cycle,
        query: A.stringify(query),
        chart: A.stringify(spec),
      })

      setChartImage(data.svg)
    } catch (err) {
      console.log(err)
    }
  }, [spec, surveyId, cycle])

  return {
    chartImage,
    renderChart,
  }
}

export default useChartRender
