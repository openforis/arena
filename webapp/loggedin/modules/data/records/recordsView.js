import './recordsView.scss'

import React from 'react'
import { connect } from 'react-redux'
import { useHistory } from 'react-router'

import * as Record from '@core/record/record'

import { useLang } from '@webapp/store/system'
import { useUser } from '@webapp/store/user'

import { useOnUpdate } from '@webapp/components/hooks'

import { SurveyState } from '@webapp/store/survey'
import TableView from '../../../tableViews/tableView'
import { appModuleUri, dataModules } from '@webapp/app/appModules'
import { createRecord } from '../../../surveyViews/record/actions'
import { reloadListItems } from '../../../tableViews/actions'
import RecordsHeaderLeft from './components/recordsHeaderLeft'
import RecordsRowHeader from './components/recordsRowHeader'
import RecordsRow from './components/recordsRow'

import * as RecordsState from './recordsState'


const RecordsView = (props) => {
  const { surveyInfo, surveyCycleKey, nodeDefKeys, createRecord, reloadListItems } = props
  const history = useHistory()
  const lang = useLang()
  const user = useUser()
  const noCols = 3 + nodeDefKeys.length
  const gridTemplateColumns = `70px repeat(${noCols}, ${1 / noCols}fr) 50px 80px 80px 50px`

  const restParams = { cycle: surveyCycleKey }

  const onRowClick = (record) => history.push(`${appModuleUri(dataModules.record)}${Record.getUuid(record)}`)

  useOnUpdate(() => {
    reloadListItems(RecordsState.keys.records, restParams)
  }, [surveyCycleKey])

  return (
    <TableView
      module={RecordsState.keys.records}
      restParams={restParams}
      className="records"
      gridTemplateColumns={gridTemplateColumns}
      headerLeftComponent={RecordsHeaderLeft}
      rowHeaderComponent={RecordsRowHeader}
      rowComponent={RecordsRow}
      noItemsLabelKey={'dataView.records.noRecordsAdded'}
      surveyInfo={surveyInfo}
      user={user}
      createRecord={createRecord}
      nodeDefKeys={nodeDefKeys}
      lang={lang}
      onRowClick={onRowClick}
    />
  )
}

const mapStateToProps = (state) => ({
  surveyInfo: SurveyState.getSurveyInfo(state),
  surveyCycleKey: SurveyState.getSurveyCycleKey(state),
  nodeDefKeys: RecordsState.getNodeDefKeys(state),
})

export default connect(mapStateToProps, { createRecord, reloadListItems })(RecordsView)
