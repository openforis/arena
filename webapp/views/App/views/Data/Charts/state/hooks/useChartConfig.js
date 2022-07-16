import { useCallback, useState, useEffect, useMemo } from 'react'

const defaultConfig = {
  type: 'pie',
  table: null,
  items: [],
}

const getValueByBlockPath = ({ obj, blockPath }) => obj[blockPath]?.value || []

const updateObjectValueByPath = ({ obj, blockPath, value }) => {
  obj[blockPath] = { ...(obj[blockPath] || { blockPath }), value }
  return obj
}

const getItemsByPath = (config) =>
  (config?.items || []).reduce((acc, item) => Object.assign({}, acc, { [item.blockPath]: item }), {})

const addItemByPath = (blockPath, item) => (obj) => {
  let _value = getValueByBlockPath({ obj, blockPath })
  _value.push(item)
  return updateObjectValueByPath({ obj, blockPath, value: _value })
}

const updateItemByPathAndKey = (blockPath, value) => (obj) => {
  let _value = getValueByBlockPath({ obj, blockPath })
  _value = _value.map((_val) => {
    if (_val.key === value.key) {
      return value
    }
    return _val
  })
  return updateObjectValueByPath({ obj, blockPath, value: _value })
}

const useChartConfig = ({ table, setTable }) => {
  const [config, setConfig] = useState(defaultConfig)
  const [configItemsByPath, setConfigItemsByPath] = useState({})

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
  const addValue = useCallback(
    (payload) => {
      const { blockPath, value } = payload

      setConfigItemsByPath((_configItemsByPath) => {
        const newItems = Object.assign({}, _configItemsByPath)
        addItemByPath(blockPath, value)(newItems)
        return newItems
      })
    },
    [setConfigItemsByPath]
  )

  const replaceValue = useCallback(
    (payload) => {
      const { blockPath, value } = payload
      setConfigItemsByPath((_configItemsByPath) => {
        const newItems = Object.assign({}, _configItemsByPath)
        newItems[blockPath] = { ...(newItems[blockPath] || { blockPath }), value }
        return newItems
      })
    },
    [setConfigItemsByPath]
  )

  const removeValue = useCallback(
    (payload) => {
      const { blockPath, value } = payload

      setConfigItemsByPath((_configItemsByPath) => {
        const newItems = Object.assign({}, _configItemsByPath)
        let _value = newItems[blockPath]?.value || []
        _value = _value.filter((_val) => _val.key !== value.key)
        newItems[blockPath] = { ...(newItems[blockPath] || { blockPath }), value: _value }
        return newItems
      })
    },
    [setConfigItemsByPath]
  )

  const updateValue = useCallback(
    (payload) => {
      const { blockPath, value } = payload

      setConfigItemsByPath((_configItemsByPath) => {
        const newItems = Object.assign({}, _configItemsByPath)

        updateItemByPathAndKey(blockPath, value)(newItems)

        return newItems
      })
    },
    [setConfigItemsByPath]
  )

  const configActions = useMemo(() => {
    return {
      changeType,
      addValue,
      updateValue,
      removeValue,
      replaceValue,
    }
  }, [changeType, addValue, updateValue, removeValue, replaceValue])

  return { config, configItemsByPath, configActions }
}

export default useChartConfig
