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

const updateHistory = (item) => (history) => {
  history.push(item)
  return history
}

const addItemByPath = (blockPath, item) => (obj) => {
  let _value = getValueByBlockPath({ obj, blockPath })
  _value.push(item)
  return updateObjectValueByPath({ obj, blockPath, value: _value })
}

const removeItemByPath = (blockPath, item) => (obj) => {
  let _value = getValueByBlockPath({ obj, blockPath })
  _value = _value.filter((_val) => _val.key !== item.key)
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
  const [initialConfig, setInitialConfig] = useState(defaultConfig)
  const [history, setHistory] = useState([])
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
    setHistory(updateHistory({ action: 'set_table', payload: { table } }))
  }, [table])

  const changeType = useCallback((type) => {
    setConfig((config) => Object.assign({}, config, { type }))
    setHistory(updateHistory({ action: 'set_type', payload: { type } }))
  }, [])
  const addValue = useCallback(
    (payload) => {
      const { blockPath, value } = payload

      setConfigItemsByPath((_configItemsByPath) => {
        const newItems = Object.assign({}, _configItemsByPath)
        addItemByPath(blockPath, value)(newItems)
        return newItems
      })

      setHistory(updateHistory({ action: 'add', payload }))
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
      setHistory(updateHistory({ action: 'replace', payload }))
    },
    [setConfigItemsByPath]
  )

  const removeValue = useCallback(
    (payload) => {
      const { blockPath, value } = payload

      setConfigItemsByPath((_configItemsByPath) => {
        const newItems = Object.assign({}, _configItemsByPath)
        removeItemByPath(blockPath, value)(newItems)
        return newItems
      })

      setHistory(updateHistory({ action: 'remove', payload }))
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

      setHistory(updateHistory({ action: 'update', payload }))
    },
    [setConfigItemsByPath]
  )

  const addOrUpdateMetric = useCallback(
    (payload) => {
      const { blockPath, values = {}, metric } = payload

      const exists = configItemsByPath?.[blockPath]?.value?.some((item) => item.key === metric.key)
      if (exists) {
        setConfigItemsByPath((_configItemsByPath) => {
          const newItems = Object.assign({}, _configItemsByPath)
          Object.entries(values).forEach(([key, value]) => {
            const _blockPath = `${blockPath}.${key}`
            updateItemByPathAndKey(_blockPath, value[0])(newItems)
          })

          return newItems
        })
      } else {
        setConfigItemsByPath((_configItemsByPath) => {
          const newItems = Object.assign({}, _configItemsByPath)
          addItemByPath(blockPath, metric)(newItems)
          Object.entries(values).forEach(([key, value]) => {
            addItemByPath(`${blockPath}.${key}`, value[0])(newItems)
          })
          return newItems
        })
      }

      setHistory(updateHistory({ action: 'addOrUpdateMetric', payload }))
    },
    [configItemsByPath]
  )

  const deleteMetric = useCallback(
    (payload) => {
      const { blockPath, metric, values } = payload

      // subitems
      // bloackPath
      console.log(blockPath, metric, values)

      setConfigItemsByPath((_configItemsByPath) => {
        const newItems = Object.assign({}, _configItemsByPath)
        console.log('start newITems', JSON.stringify(newItems, null, 2))
        removeItemByPath(blockPath, metric)(newItems)
        Object.entries(values).forEach(([key, value]) => {
          const _blockPath = `${blockPath}.${key}`
          removeItemByPath(_blockPath, value)(newItems)
        })

        /*Object.entries(values).forEach(([key, value]) => {
          if (pathsToDelete.includes(key)) {
            // replace of values
            console.log('key', key)
          }
        })*/

        console.log('end newITems', JSON.stringify(newItems, null, 2))
        return newItems
      })

      setHistory(updateHistory({ action: 'removeMetric', payload }))
    },
    [configItemsByPath]
  )

  const configActions = useMemo(() => {
    return {
      changeType,
      addValue,
      updateValue,
      removeValue,
      replaceValue,
      addOrUpdateMetric,
      deleteMetric,
    }
  }, [changeType, addValue, updateValue, removeValue, replaceValue, addOrUpdateMetric, deleteMetric])

  return { config, configItemsByPath, configActions }
}

export default useChartConfig
