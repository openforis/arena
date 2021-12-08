import './Records.scss'

import React, { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'

import * as Record from '@core/record/record'

import { useSurveyCycleKey, useNodeDefRootKeys } from '@webapp/store/survey'

import { appModuleUri, dataModules } from '@webapp/app/appModules'

import Table from '@webapp/components/Table'

import HeaderLeft from './HeaderLeft'
import RowHeader from './RowHeader'
import Row from './Row'

const Records = () => {
  const navigate = useNavigate()
  const cycle = useSurveyCycleKey()
  const nodeDefKeys = useNodeDefRootKeys()

  const [recordsRequestedAt, setRecordsRequestedAt] = useState(Date.now())

  const noCols = 3 + nodeDefKeys.length
  const gridTemplateColumns = `70px repeat(${noCols}, ${1 / noCols}fr) 80px 80px 80px 50px`

  const onRowClick = (record) => navigate(`${appModuleUri(dataModules.record)}${Record.getUuid(record)}`)

  const onRecordsUpdate = useCallback(() => {
    setRecordsRequestedAt(Date.now())
  }, [setRecordsRequestedAt])

  return (
    <Table
      module="records"
      restParams={{ cycle, recordsRequestedAt }}
      className="records"
      gridTemplateColumns={gridTemplateColumns}
      headerLeftComponent={HeaderLeft}
      headerProps={{ onRecordsUpdate }}
      rowHeaderComponent={RowHeader}
      rowComponent={Row}
      noItemsLabelKey="dataView.records.noRecordsAdded"
      noItemsLabelForSearchKey="dataView.records.noRecordsAddedForThisSearch"
      onRowClick={onRowClick}
    />
  )
}

export default Records
