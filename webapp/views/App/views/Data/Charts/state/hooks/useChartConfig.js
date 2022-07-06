import { useCallback, useState, useEffect, useMemo } from 'react'
import { uuidv4 } from '@core/uuid'

const defaultConfig = {
  type: 'pie',
  table: null,
  items: [],
}

const getItemsByPath = (config) =>
  (config?.items || []).reduce((acc, item) => Object.assign({}, acc, { [item.blockPath]: item }), {})

const useChartConfig = ({ table, setTable }) => {
  const [initialConfig, setInitialConfig] = useState(defaultConfig)
  const [config, setConfig] = useState(_config)
  const [configItemsByPath, setConfigItemsByPath] = useState(defaultConfig)

  useEffect(() => {
    setConfigItemsByPath(getItemsByPath(config))
    if (config.table && config.table !== table) {
      setTable(config.table)
    }
  }, [config])

  useEffect(() => {
    setConfig((config) => Object.assign({}, config, { table }))
  }, [table])

  const changeType = useCallback((type) => {
    setConfig((config) => Object.assign({}, config, { type }))
  }, [])

  const configActions = useMemo(() => {
    return {
      changeType,
    }
  }, [changeType])

  return { config, configItemsByPath, configActions }
}

export default useChartConfig
