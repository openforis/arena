import './recordsSummary.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'

import useI18n from '../../../../../commonComponents/useI18n'
import RecordsSummaryChart from './chart/recordsSummaryChart'

import { fetchRecordsAddedSummary } from './actions'

const RecordsSummary = props => {
  const { fetchRecordsAddedSummary } = props

  const i18n = useI18n()

  useEffect(() => {
    fetchRecordsAddedSummary()
  }, [])

  return (
    <div className="home-dashboard__records-summary">

      <div>
        <h6 className="text-uppercase">
          {i18n.t('homeView.recordsSummary.newRecords')}
        </h6>
      </div>


      <RecordsSummaryChart/>

    </div>
  )
}

export default connect(null, { fetchRecordsAddedSummary })(RecordsSummary)