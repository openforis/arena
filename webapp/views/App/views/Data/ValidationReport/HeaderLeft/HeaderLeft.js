import React from 'react'

import { useSurveyId } from '@webapp/store/survey'

import { ButtonDownload } from '@webapp/components'

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
