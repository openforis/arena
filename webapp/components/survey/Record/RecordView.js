import React from 'react'

import SurveyFormView from '../../../loggedin/surveyViews/surveyForm/surveyFormView'
import { useRecordView } from './useRecordView'

const RecordView = () => {
  const { canEditRecord, preview, recordLoaded } = useRecordView()

  return recordLoaded ? (
    <SurveyFormView draft={preview} preview={preview} edit={false} entry canEditRecord={canEditRecord} />
  ) : null
}

export default RecordView
