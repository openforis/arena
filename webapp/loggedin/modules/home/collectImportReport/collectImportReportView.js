import './collectImportReportView.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import SurveyDefsLoader from '../../../surveyViews/surveyDefsLoader/surveyDefsLoader'
import TableHeader from './components/tableHeader'
import TableRows from './components/tableRows'

import * as CollectImportReportState from './collectImportReportState'

import { fetchCollectImportReportItems } from './actions'

const CollectImportReportView = props => {
  const { reportItems, fetchCollectImportReportItems } = props

  useEffect(() => {
    fetchCollectImportReportItems()
  }, [])

  return R.isEmpty(reportItems) ? null : (
    <SurveyDefsLoader draft={true} validate={true}>
      <div className="collect-import-report table">
        <TableHeader />

        <TableRows reportItems={reportItems} />
      </div>
    </SurveyDefsLoader>
  )
}

const mapStateToProps = state => ({
  reportItems: CollectImportReportState.getState(state),
})
export default connect(mapStateToProps, { fetchCollectImportReportItems })(CollectImportReportView)
