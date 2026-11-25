import './Records.scss'

import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

import { WebSocketEvents } from '@common/webSocket/webSocketEvents'
import * as Record from '@core/record/record'
import { appModuleUri, dataModules } from '@webapp/app/appModules'
import { LoadingBar } from '@webapp/components'
import { useOnWebSocketEvent } from '@webapp/components/hooks'
import Table from '@webapp/components/Table'
import { useNodeDefRootKeys, useSurveyCycleKey } from '@webapp/store/survey'

import HeaderLeft from './HeaderLeft'
import { useColumns } from './useColumns'
import { useNodeDefKeyAndSummaryCategoryItemsInLevel } from './useNodeDefKeyAndSummaryCategoryItemsInLevel'

const Records = () => {
  const navigate = useNavigate()
  const cycle = useSurveyCycleKey()
  const nodeDefKeys = useNodeDefRootKeys()
  const categoryItemsByCodeDefUuid = useNodeDefKeyAndSummaryCategoryItemsInLevel()

  const navigateToRecord = useCallback(
    (record) => navigate(`${appModuleUri(dataModules.record)}${Record.getUuid(record)}?locked=true`),
    [navigate]
  )
  const [recordsRequestedAt, setRecordsRequestedAt] = useState(() => Date.now())

  const onRecordsUpdate = useCallback(() => {
    setRecordsRequestedAt(Date.now())
  }, [setRecordsRequestedAt])

  const columns = useColumns({ categoryItemsByCodeDefUuid, navigateToRecord, onRecordsUpdate })
  // memoized: new objects at every render would re-render all the rows
  const cellProps = useMemo(() => ({ onRecordsUpdate }), [onRecordsUpdate])
  const rowProps = useMemo(
    () => ({ navigateToRecord, onRecordsUpdate, categoryItemsByCodeDefUuid }),
    [categoryItemsByCodeDefUuid, navigateToRecord, onRecordsUpdate]
  )

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
      cellProps={cellProps}
      className="records"
      columns={columns}
      gridTemplateColumns={gridTemplateColumns}
      headerLeftComponent={HeaderLeft}
      headerProps={{ navigateToRecord, onRecordsUpdate }}
      module="records/summary"
      noItemsLabelKey="dataView:records.noRecordsAdded"
      noItemsLabelForSearchKey="dataView:records.noRecordsAddedForThisSearch"
      onRowOpen={navigateToRecord}
      restParams={{ cycle, includeCounts: true, recordsRequestedAt }}
      rowProps={rowProps}
      selectable
      visibleColumnsSelectionEnabled
    />
  )
}

export default Records
