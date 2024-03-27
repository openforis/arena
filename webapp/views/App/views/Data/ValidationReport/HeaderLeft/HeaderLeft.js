import React from 'react'

import { ButtonDownload } from '@webapp/components'
import { useSurveyId } from '@webapp/store/survey'

export const HeaderLeft = ({ restParams }) => {
  const surveyId = useSurveyId()

  return (
    <>
      <ButtonDownload
        className="btn-csv-export"
        href={`/api/survey/${surveyId}/validationReport/csv`}
        requestParams={restParams}
        label="common.csvExport"
      />
    </>
  )
}
