import React from 'react'
import PropTypes from 'prop-types'

import Record from './Record'
import SurveyDefsLoader from '../SurveyDefsLoader/SurveyDefsLoader'

export const RecordNoHeader = (props) => {
  const { recordUuid, pageNodeIId } = props

  return (
    <SurveyDefsLoader draft={false} requirePublish>
      <Record recordUuid={recordUuid} pageNodeIId={pageNodeIId} noHeader />
    </SurveyDefsLoader>
  )
}

RecordNoHeader.propTypes = {
  recordUuid: PropTypes.string.isRequired,
  pageNodeIId: PropTypes.number.isRequired,
}
