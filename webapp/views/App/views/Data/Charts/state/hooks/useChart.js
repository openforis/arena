import { useEffect, useState } from 'react'

import useChartSpec from './useChartSpec'
import useChartConfig from './useChartConfig'
import useChartRender from './useChartRender'

const useChart = (query, table, setTable) => {
  const [draft, setDraft] = useState(null)

  const { config, configItemsByPath, configActions } = useChartConfig({ table, setTable })
  const { spec, updateSpec } = useChartSpec({ config, configItemsByPath })

  const { chartImage, renderChart } = useChartRender(spec, query)

  useEffect(() => {
    setDraft(false)
  }, [chartImage])

  useEffect(() => {
    setDraft(true)
  }, [spec])

  return { config, configItemsByPath, configActions, spec, updateSpec, draft, chartImage, renderChart }
}

export default useChart
