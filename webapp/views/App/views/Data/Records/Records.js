import './Records.scss'

import React, { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'

import * as Record from '@core/record/record'

import { useSurveyCycleKey, useNodeDefRootKeys } from '@webapp/store/survey'

import { appModuleUri, dataModules } from '@webapp/app/appModules'

import Table from '@webapp/components/Table'
import { useOnWebSocketEvent } from '@webapp/components/hooks'
import { WebSocketEvents } from '@common/webSocket/webSocketEvents'

import HeaderLeft from './HeaderLeft'
import RowHeader from './RowHeader'
import Row from './Row'

const Records = () => {
  const navigate = useNavigate()
  const cycle = useSurveyCycleKey()
  const nodeDefKeys = useNodeDefRootKeys()

  const [recordsRequestedAt, setRecordsRequestedAt] = useState(Date.now())

  const noCols = 3 + nodeDefKeys.length
  const gridTemplateColumns = `30px 70px repeat(${noCols}, ${1 / noCols}fr) 80px 80px 80px 80px`

  const navigateToRecord = useCallback(
    (record) => navigate(`${appModuleUri(dataModules.record)}${Record.getUuid(record)}`),
    [navigate]
  )
  const refreshData = useCallback(() => {
    setRecordsRequestedAt(Date.now())
  }, [setRecordsRequestedAt])

  const onRecordsUpdate = refreshData

  useOnWebSocketEvent({
    eventName: WebSocketEvents.recordDelete,
    eventHandler: refreshData,
  })

  return (
    <Table
      module="records/summary"
      restParams={{ cycle, recordsRequestedAt }}
      className="records"
      gridTemplateColumns={gridTemplateColumns}
      headerLeftComponent={HeaderLeft}
      headerProps={{ onRecordsUpdate, navigateToRecord }}
      rowHeaderComponent={RowHeader}
      rowComponent={Row}
      rowProps={{ onRecordsUpdate, navigateToRecord }}
      noItemsLabelKey="dataView.records.noRecordsAdded"
      noItemsLabelForSearchKey="dataView.records.noRecordsAddedForThisSearch"
      onRowDoubleClick={navigateToRecord}
    />
  )
}

export default Records
