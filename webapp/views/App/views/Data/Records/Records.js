import './Records.scss'

import React from 'react'
import { useHistory } from 'react-router'

import * as Record from '@core/record/record'

import { useSurveyCycleKey, useNodeDefRootKeys } from '@webapp/store/survey'

import { appModuleUri, dataModules } from '@webapp/app/appModules'

import Table from '@webapp/components/Table'

import HeaderLeft from './HeaderLeft'
import RowHeader from './RowHeader'
import Row from './Row'

const Records = () => {
  const history = useHistory()
  const cycle = useSurveyCycleKey()
  const nodeDefKeys = useNodeDefRootKeys()

  const noCols = 3 + nodeDefKeys.length
  const gridTemplateColumns = `70px repeat(${noCols}, ${1 / noCols}fr) 80px 80px 80px 50px`

  const onRowClick = (record) => history.push(`${appModuleUri(dataModules.record)}${Record.getUuid(record)}`)

  return (
    <Table
      module="records"
      restParams={{ cycle }}
      className="records"
      gridTemplateColumns={gridTemplateColumns}
      headerLeftComponent={HeaderLeft}
      rowHeaderComponent={RowHeader}
      rowComponent={Row}
      noItemsLabelKey={"dataView.records.noRecordsAdded"}
      noItemsLabelForSearchKey={"dataView.records.noRecordsAddedForThisSearch" }
      onRowClick={onRowClick}
    />
  )
}

export default Records
