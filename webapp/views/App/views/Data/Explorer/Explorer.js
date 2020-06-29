import React, { useState } from 'react'
import { matchPath } from 'react-router'

import { Query } from '@common/model/query'
import { appModuleUri, dataModules } from '@webapp/app/appModules'

import { ExplorerStorage } from '@webapp/service/storage/explorer'

import { useHistoryListen } from '@webapp/components/hooks'
import DataQuery from '@webapp/components/DataQuery'

const Explorer = () => {
  const queryStorage = ExplorerStorage.getQuery()
  const [query, setQuery] = useState(queryStorage || Query.create())

  useHistoryListen(
    (location) => {
      // user clicks record link in table edit mode: query gets persisted in storage
      if (matchPath(location.pathname, { path: appModuleUri(dataModules.record) })) {
        ExplorerStorage.persistQuery(query)
      } else {
        ExplorerStorage.removeQuery()
      }
    },
    [query]
  )

  return <DataQuery query={query} onChangeQuery={setQuery} />
}

export default Explorer
