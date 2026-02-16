import React from 'react'

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
