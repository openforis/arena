import React from 'react'

import SurveyFormView from '@webapp/components/survey/SurveyForm'
import { useRecordView } from './useRecordView'

const RecordView = () => {
  const { canEditRecord, preview, recordLoaded } = useRecordView()

  return recordLoaded ? (
    <SurveyFormView draft={preview} preview={preview} edit={false} entry canEditRecord={canEditRecord} />
  ) : null
}

export default RecordView
