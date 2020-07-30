import React from 'react'
import { useSelector } from 'react-redux'

import { RecordState } from '@webapp/store/ui/record'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import SurveyFormView from '@webapp/components/survey/SurveyForm'
import Record from '@webapp/components/survey/Record'

const FormDesigner = () => {
  const canEditDef = useAuthCanEditSurvey()
  const recordPreviewUuid = useSelector(RecordState.getRecordUuidPreview)

  return recordPreviewUuid ? <Record canEditDef={canEditDef} /> : <SurveyFormView edit draft canEditDef={canEditDef} />
}

export default FormDesigner
