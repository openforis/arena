import './Charts.scss'
import React, { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import * as A from '@core/arena'

import { Query } from '@common/model/query'
import { useSurveyId, useSurveyCycleKey } from '@webapp/store/survey'
import Chart from './components/Chart'
import Panel from './components/Panel'
import DataSelector from './components/DataSelector'

export const getUrl = ({ surveyId, query }) => `/api/reporting/${surveyId}/${Query.getEntityDefUuid(query)}/chart`

const BASE_SPEC = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  name: 'tree_health_label',
  description: 'tree_health_label_b',
  title: {
    text: 'tree_health_label_v',
  },
  layer: [
    {
      mark: { type: 'arc', innerRadius: 40, outerRadius: 60 },
    },
  ],
}

const useChartSpec = () => {
  const [spec, setSpec] = useState(BASE_SPEC)

  const updateSpecRaw = useCallback((newSpec) => {
    setSpec(newSpec)
  }, [])

  const updateSpec = useCallback((newSpec) => {
    updateSpecRaw(A.parse(newSpec))
  }, [])

  return { spec, updateSpec }
}

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

const useChart = (query) => {
  const [draft, setDraft] = useState(null)

  const { spec, updateSpec } = useChartSpec()
  const { chartImage, renderChart } = useChartRender(spec, query)

  useEffect(() => {
    setDraft(false)
  }, [chartImage])

  useEffect(() => {
    setDraft(true)
  }, [spec])

  return { spec, updateSpec, draft, chartImage, renderChart }
}

const Charts = () => {
  const [entityDefUuid, setEntityDefUuid] = useState(null)

  const { chartImage } = useChart(entityDefUuid ? Query.create({ entityDefUuid }) : null)

  return (
    <div className="charts">
      <DataSelector setEntityDefUuid={setEntityDefUuid} entityDefUuid={entityDefUuid} />

      <Panel />

      <div className="charts_chart__container">
        <Chart
          src={chartImage ? `data:image/svg+xml;base64,${btoa(decodeURI(encodeURIComponent(chartImage)))}` : false}
        />
      </div>
    </div>
  )
}

export default Charts
