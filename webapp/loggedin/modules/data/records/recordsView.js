import './recordsView.scss'

import React from 'react'
import { useHistory } from 'react-router'

import * as Record from '@core/record/record'

import { useSurveyCycleKey } from '@webapp/store/survey'

import { appModuleUri, dataModules } from '@webapp/app/appModules'

import Table from '@webapp/components/Table'

import RecordsHeaderLeft from './components/recordsHeaderLeft'
import RecordsRowHeader from './components/recordsRowHeader'
import RecordsRow from './components/recordsRow'

const RecordsView = () => {
  const history = useHistory()
  const cycle = useSurveyCycleKey()
  const nodeDefKeys = [] // TODO: fetch them

  const noCols = 3 + nodeDefKeys.length
  const gridTemplateColumns = `70px repeat(${noCols}, ${1 / noCols}fr) 50px 80px 80px 50px`

  const onRowClick = (record) => history.push(`${appModuleUri(dataModules.record)}${Record.getUuid(record)}`)

  return (
    <Table
      module="records"
      restParams={{ cycle }}
      className="records"
      gridTemplateColumns={gridTemplateColumns}
      headerLeftComponent={RecordsHeaderLeft}
      rowHeaderComponent={RecordsRowHeader}
      rowComponent={RecordsRow}
      noItemsLabelKey="dataView.records.noRecordsAdded"
      onRowClick={onRowClick}
    />
  )
}

export default RecordsView
