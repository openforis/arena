import SurveyDefsLoader from '../SurveyDefsLoader/SurveyDefsLoader'

import Record from './Record'

export const RecordNoHeader = (props) => {
  const { recordUuid, pageNodeUuid } = props

  return (
    <SurveyDefsLoader draft={false} requirePublish>
      <Record recordUuid={recordUuid} pageNodeUuid={pageNodeUuid} noHeader />
    </SurveyDefsLoader>
  )
}
