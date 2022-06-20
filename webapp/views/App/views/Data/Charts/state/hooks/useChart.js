import { useEffect, useState } from 'react'

import useChartSpec from './useChartSpec'
import useChartRender from './useChartRender'

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

export default useChart
