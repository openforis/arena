import React, { useCallback, useState } from 'react'

import { Query } from '@common/model/query'
import { appModuleUri, dataModules } from '@webapp/app/appModules'

import { ExplorerStorage } from '@webapp/service/storage/explorer'

import { useIsInRoute, useOnLocationUpdate } from '@webapp/components/hooks'
import DataQuery from '@webapp/components/DataQuery'

const Explorer = () => {
  const queryStorage = ExplorerStorage.getQuery()
  const [query, setQuery] = useState(queryStorage || Query.create())

  const isInRecordRoute = useIsInRoute(appModuleUri(dataModules.record))
  const isInExplorerRoute = useIsInRoute(appModuleUri(dataModules.explorer))

  const onLocationUpdated = useCallback(() => {
    if (!isInExplorerRoute) {
      // user clicks record link in table edit mode: query gets persisted in storage
      if (isInRecordRoute) {
        ExplorerStorage.persistQuery(query)
      } else {
        ExplorerStorage.removeQuery()
      }
    }
  }, [query])

  useOnLocationUpdate(onLocationUpdated, [])

  return <DataQuery query={query} onChangeQuery={setQuery} />
}

export default Explorer
