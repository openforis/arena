import React, { useEffect, useState } from 'react'

import { Query } from '@common/model/query'

import { appModuleUri, dataModules } from '@webapp/app/appModules'
import DataQuery from '@webapp/components/DataQuery'
import { useLocationPathMatcher } from '@webapp/components/hooks/useIsInRoute'
import { ExplorerStorage } from '@webapp/service/storage/explorer'

const Explorer = () => {
  const queryStorage = ExplorerStorage.getQuery()
  const [query, setQuery] = useState(queryStorage || Query.create())

  const getQueryFromState = () => {
    let result = null
    setQuery((queryPrev) => {
      result = queryPrev
      return queryPrev
    })
    return result
  }

  const pathMatcher = useLocationPathMatcher()

  // on unmount, store query into local storage if location is record edit module
  const onUnmount = () => {
    if (!pathMatcher(appModuleUri(dataModules.explorer))) {
      if (pathMatcher(`${appModuleUri(dataModules.record)}:uuid`)) {
        // do not use "query": in this callback it's value is not up to date
        const queryCurrent = getQueryFromState()
        ExplorerStorage.persistQuery(queryCurrent)
      } else {
        ExplorerStorage.removeQuery()
      }
    }
  }

  useEffect(() => {
    return onUnmount
  }, [])

  return <DataQuery query={query} onChangeQuery={setQuery} />
}

export default Explorer
