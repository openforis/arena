import './recordsView.scss'

import React from 'react'
import { connect } from 'react-redux'

import Record from '../../../../../common/record/record'

import TableView from '../../../tableViews/tableView'
import RecordsHeaderLeft from './components/recordsHeaderLeft'
import RecordsRowHeader from './components/recordsRowHeader'
import RecordsRow from './components/recordsRow'

import { appModuleUri, dataModules } from '../../../appModules'

import * as AppState from '../../../../app/appState'
import * as RecordsState from './recordsState'
import * as SurveyState from '../../../../survey/surveyState'

import { createRecord } from '../../../surveyViews/record/actions'

const RecordsView = props => {

  const {
    surveyInfo, user, nodeDefKeys, lang,
    createRecord, history,
  } = props

  const noCols = 3 + nodeDefKeys.length
  const gridTemplateColumns = `70px repeat(${noCols}, ${1 / noCols}fr) 50px 80px 80px 50px`

  const onRowClick = record => history.push(`${appModuleUri(dataModules.record)}${Record.getUuid(record)}`)

  return (
    <TableView
      module={RecordsState.keys.records}
      className="records"
      gridTemplateColumns={gridTemplateColumns}
      headerLeftComponent={RecordsHeaderLeft}
      rowHeaderComponent={RecordsRowHeader}
      rowComponent={RecordsRow}
      noItemsLabelKey={'dataView.records.noRecordsAdded'}

      surveyInfo={surveyInfo}
      user={user}
      createRecord={createRecord}
      history={history}
      nodeDefKeys={nodeDefKeys}
      lang={lang}

      onRowClick={onRowClick}
    />
  )
}

const mapStateToProps = state => ({
  lang: AppState.getLang(state),
  user: AppState.getUser(state),
  surveyInfo: SurveyState.getSurveyInfo(state),
  nodeDefKeys: RecordsState.getNodeDefKeys(state),
})

export default connect(mapStateToProps, { createRecord })(RecordsView)
