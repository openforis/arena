import React from 'react'
import PropTypes from 'prop-types'

import Record from './Record'
import SurveyDefsLoader from '../SurveyDefsLoader/SurveyDefsLoader'

const RecordNoHeader = (props) => {
  const { recordUuid, pageNodeUuid } = props

  return (
    <SurveyDefsLoader draft={false} requirePublish>
      <Record recordUuid={recordUuid} pageNodeUuid={pageNodeUuid} noHeader />
    </SurveyDefsLoader>
  )
}

RecordNoHeader.propTypes = {
  recordUuid: PropTypes.string.isRequired,
  pageNodeUuid: PropTypes.string,
}

export default RecordNoHeader
