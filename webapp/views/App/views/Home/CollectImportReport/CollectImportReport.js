import './CollectImportReport.scss'

import React from 'react'

import Table from '@webapp/components/Table'

import { useSurveyId } from '@webapp/store/survey'

import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'

import HeaderLeft from './HeaderLeft'
import RowHeader from './RowHeader'
import Row from './Row'

const CollectImportReport = () => {
  const surveyId = useSurveyId()

  return (
    <SurveyDefsLoader draft validate>
      <Table
        className="collect-import-report"
        module="collect-import-report"
        moduleApiUri={`/api/survey/${surveyId}/collect-import/report`}
        gridTemplateColumns="60px repeat(5, 0.2fr) 0.1fr 30px"
        headerLeftComponent={HeaderLeft}
        rowHeaderComponent={RowHeader}
        rowComponent={Row}
      />
    </SurveyDefsLoader>
  )
}

export default CollectImportReport
