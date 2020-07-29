import React from 'react'
import { useSelector } from 'react-redux'

import SurveyFormView from '@webapp/loggedin/surveyViews/surveyForm/surveyFormView'
import RecordView from '@webapp/loggedin/surveyViews/record/recordView'

import { RecordState } from '@webapp/store/ui/record'

import { useAuthCanEditSurvey } from '@webapp/store/user'

const FormDesigner = () => {
  const canEditDef = useAuthCanEditSurvey()
  const recordPreviewUuid = useSelector(RecordState.getRecordUuidPreview)

  return recordPreviewUuid ? (
    <RecordView canEditDef={canEditDef} />
  ) : (
    <SurveyFormView edit draft canEditDef={canEditDef} />
  )
}

export default FormDesigner
