import { useCallback, useState, useEffect } from 'react'
import { chartsConfig } from '../config'

const BASE_SPEC = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
}

export const configToSpec = ({ config, configItemsByPath }) => {
  const builderBlocks = chartsConfig?.[config.type]?.builderBlocks
  let _spec = chartsConfig?.[config.type]?.baseSpec
  _spec = Object.entries(configItemsByPath).reduce((newSpec, [key, entry]) => {
    const block = key.split('.').reduce((_block, _key) => _block?.blocks[_key], builderBlocks)
    if (block?.valuesToSpec) {
      return block.valuesToSpec({ value: entry.value, spec: newSpec, key, configItemsByPath })
    }
    return newSpec
  }, _spec)
  return _spec
}

const useChartSpec = ({ config, configItemsByPath } = {}) => {
  const [spec, setSpec] = useState(BASE_SPEC)

  const updateSpecRaw = useCallback((newSpec) => {
    setSpec(newSpec)
  }, [])

  const updateSpec = useCallback((newSpec) => {
    updateSpecRaw(JSON.parse(newSpec))
  }, [])

  useEffect(() => {
    const _spec = configToSpec({ config, configItemsByPath })

    setSpec(_spec)
  }, [config, configItemsByPath])

  return { spec, updateSpec }
}

export default useChartSpec
