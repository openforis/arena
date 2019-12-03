import './validationReportView.scss'

import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import * as Record from '@core/record/record'
import * as NodeKeys from '@core/record/nodeKeys'

import TableView from '@webapp/loggedin/tableViews/tableView'
import { appModuleUri, dataModules } from '@webapp/loggedin/appModules'

import { useOnUpdate } from '@webapp/commonComponents/hooks'

import * as SurveyState from '@webapp/survey/surveyState'

import { reloadListItems } from '@webapp/loggedin/tableViews/actions'

import ValidationReportRowHeader from './validationReportRowHeader'
import ValidationReportRow from './validationReportRow'

const validationReportModule = 'validationReport'

const ValidationReportView = ({ surveyCycleKey, reloadListItems, history }) => {
  useOnUpdate(() => {
    reloadListItems(validationReportModule, { cycle: surveyCycleKey })
  }, [surveyCycleKey])

  const onRowClick = record => {
    const parentEntityUuid = R.prop(
      NodeKeys.keys.nodeUuid,
      R.last(record.keysHierarchy),
    )
    const recordUuid = Record.getUuid(record)
    const recordEditUrl = `${appModuleUri(
      dataModules.record,
    )}${recordUuid}?parentNodeUuid=${parentEntityUuid}`

    history.push(recordEditUrl)
  }

  const gridTemplateColumns = `70px 1fr 2fr 50px`

  const restParams = { cycle: surveyCycleKey }

  return (
    <TableView
      className="validation-report__table"
      module={validationReportModule}
      restParams={restParams}
      gridTemplateColumns={gridTemplateColumns}
      rowHeaderComponent={ValidationReportRowHeader}
      rowComponent={ValidationReportRow}
      onRowClick={onRowClick}
    />
  )
}

const mapStateToProps = state => ({
  surveyCycleKey: SurveyState.getSurveyCycleKey(state),
})

export default connect(mapStateToProps, { reloadListItems })(
  ValidationReportView,
)
