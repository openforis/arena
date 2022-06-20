import { useCallback, useState } from 'react'
import * as A from '@core/arena'

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

export default useChartSpec
