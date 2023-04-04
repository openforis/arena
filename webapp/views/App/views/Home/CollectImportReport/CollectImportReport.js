import './CollectImportReport.scss'

import React, { useState } from 'react'

import Table from '@webapp/components/Table'

import { useSurveyId } from '@webapp/store/survey'

import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'

import HeaderLeft from './HeaderLeft'
import RowHeader from './RowHeader'
import Row from './Row'

const CollectImportReport = () => {
  const surveyId = useSurveyId()

  const [excludeResolved, setExcludeResolved] = useState(false)

  return (
    <SurveyDefsLoader draft validate>
      <Table
        className="collect-import-report"
        module="collect-import-report"
        moduleApiUri={`/api/survey/${surveyId}/collect-import/report`}
        restParams={{ excludeResolved }}
        gridTemplateColumns="3rem 0.3fr 12rem 0.3fr 0.2fr 0.2fr 7rem 3rem"
        headerLeftComponent={() => (
          <HeaderLeft excludeResolved={excludeResolved} setExcludeResolved={setExcludeResolved} />
        )}
        rowHeaderComponent={RowHeader}
        rowComponent={Row}
      />
    </SurveyDefsLoader>
  )
}

export default CollectImportReport
