import './Records.scss'

import React, { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'

import * as Record from '@core/record/record'

import { WebSocketEvents } from '@common/webSocket/webSocketEvents'

import { useSurveyCycleKey, useNodeDefRootKeys } from '@webapp/store/survey'

import { appModuleUri, dataModules } from '@webapp/app/appModules'

import Table from '@webapp/components/Table'
import { LoadingBar } from '@webapp/components'
import { useOnWebSocketEvent } from '@webapp/components/hooks'

import HeaderLeft from './HeaderLeft'
import { useNodeDefKeysCategoryItemsInLevel } from './useNodeDefKeysCategoryItemsInLevel'
import { useColumns } from './useColumns'

const Records = () => {
  const navigate = useNavigate()
  const cycle = useSurveyCycleKey()
  const nodeDefKeys = useNodeDefRootKeys()
  const categoryItemsByCodeDefUuid = useNodeDefKeysCategoryItemsInLevel()

  const navigateToRecord = useCallback(
    (record) => navigate(`${appModuleUri(dataModules.record)}${Record.getUuid(record)}`),
    [navigate]
  )
  const [recordsRequestedAt, setRecordsRequestedAt] = useState(Date.now())

  const onRecordsUpdate = useCallback(() => {
    setRecordsRequestedAt(Date.now())
  }, [setRecordsRequestedAt])

  const columns = useColumns({ categoryItemsByCodeDefUuid, navigateToRecord, onRecordsUpdate })

  const noCols = 3 + nodeDefKeys.length
  const gridTemplateColumns = `30px 70px repeat(${noCols}, ${1 / noCols}fr) 80px 80px 80px 80px`

  useOnWebSocketEvent({
    eventName: WebSocketEvents.recordDelete,
    eventHandler: onRecordsUpdate,
  })

  if (columns === null) {
    return <LoadingBar />
  }

  return (
    <Table
      visibleColumnsSelectionEnabled
      columns={columns}
      module="records/summary"
      restParams={{ cycle, recordsRequestedAt }}
      className="records"
      gridTemplateColumns={gridTemplateColumns}
      headerLeftComponent={HeaderLeft}
      headerProps={{ navigateToRecord, onRecordsUpdate }}
      rowProps={{ navigateToRecord, onRecordsUpdate, categoryItemsByCodeDefUuid }}
      noItemsLabelKey="dataView.records.noRecordsAdded"
      noItemsLabelForSearchKey="dataView.records.noRecordsAddedForThisSearch"
      onRowDoubleClick={navigateToRecord}
    />
  )
}

export default Records
