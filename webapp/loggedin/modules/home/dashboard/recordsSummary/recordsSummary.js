import './recordsSummary.scss'

import React from 'react'
import useI18n from '../../../../../commonComponents/useI18n'

const RecordsSummary = props => {
  const i18n = useI18n()

  return (
    <div className="home-dashboard__records-summary">

      <div>
        <h6 className="text-uppercase">
          {i18n.t('homeView.recordsSummary.newRecords')}
        </h6>
      </div>

    </div>
  )
}

export default RecordsSummary