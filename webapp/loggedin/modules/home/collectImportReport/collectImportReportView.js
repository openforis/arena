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
  const { items, fetchCollectImportReportItems } = props
  const itemsEmpty = R.isEmpty(items)

  useEffect(() => {
    if (itemsEmpty) fetchCollectImportReportItems()
  }, [])

  return itemsEmpty ? null : (
    <SurveyDefsLoader draft={true} validate={true}>
      <div className="collect-import-report table">
        <TableHeader />
        <TableRows reportItems={items} />
      </div>
    </SurveyDefsLoader>
  )
}

const mapStateToProps = state => ({
  items: CollectImportReportState.getItems(state),
})
export default connect(mapStateToProps, { fetchCollectImportReportItems })(CollectImportReportView)
