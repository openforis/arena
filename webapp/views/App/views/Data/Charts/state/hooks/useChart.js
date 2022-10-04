import { useEffect, useState } from 'react'

import useChartSpec from './useChartSpec'
import useChartConfig from './useChartConfig'
import useChartRender from './useChartRender'

const useChart = (query, table, setTable) => {
  const [draft, setDraft] = useState(null)

  const { config, configItemsByPath, configActions } = useChartConfig({ table, setTable })
  const { spec, updateSpec } = useChartSpec({ config, configItemsByPath })

  const { chartData, renderChart } = useChartRender(spec, query)

  useEffect(() => {
    setDraft(false)
  }, [chartData])

  useEffect(() => {
    setDraft(true)
  }, [spec])

  return { config, configItemsByPath, configActions, spec, updateSpec, draft, chartData, renderChart }
}

export default useChart
