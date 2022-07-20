import { useCallback, useState, useEffect } from 'react'
import * as A from '@core/arena'
import { chartsConfig } from '../config'

const BASE_SPEC = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
}

const useChartSpec = ({ config, configItemsByPath } = {}) => {
  // TODO: Revisit this to improve it
  if (
    'query.metric' in configItemsByPath &&
    'query.metric.aggregation' in configItemsByPath &&
    'query.metric.column' in configItemsByPath
  ) {
    configItemsByPath['query.metric']['value'] = [
      {
        aggregation: configItemsByPath['query.metric.aggregation']['value'],
        column: configItemsByPath['query.metric.column']['value'],
      },
    ]
  }

  const [spec, setSpec] = useState(BASE_SPEC)

  const updateSpecRaw = useCallback((newSpec) => {
    setSpec(newSpec)
  }, [])

  const updateSpec = useCallback((newSpec) => {
    updateSpecRaw(A.parse(newSpec))
  }, [])

  useEffect(() => {
    const builderBlocks = chartsConfig?.[config.type]?.builderBlocks
    let _spec = chartsConfig?.[config.type]?.baseSpec
    _spec = Object.entries(configItemsByPath).reduce((newSpec, [key, entry]) => {
      const block = key.split('.').reduce((_block, _key) => {
        return _block.blocks[_key]
      }, builderBlocks)
      if (block.valuesToSpec) {
        // maybe is better return items like [ transforms, encondigs] and the join here using a forEach instead a reduce and build the spec after the execution of the loop
        // but there is some functions that can transform some things like the innerRadios or outerRadious in mark
        return block.valuesToSpec({ value: entry.value, spec: newSpec })
      }
      return newSpec
    }, _spec)

    setSpec(_spec)
  }, [config, configItemsByPath])

  return { spec, updateSpec }
}

export default useChartSpec
