import React from 'react'

import Record from './Record'
import SurveyDefsLoader from '../SurveyDefsLoader/SurveyDefsLoader'

export const RecordNoHeader = (props) => {
  const { recordUuid, pageNodeUuid } = props

  return (
    <SurveyDefsLoader draft={false} requirePublish>
      <Record recordUuid={recordUuid} pageNodeUuid={pageNodeUuid} noHeader />
    </SurveyDefsLoader>
  )
}
