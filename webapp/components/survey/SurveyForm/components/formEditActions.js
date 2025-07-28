import React from 'react'
import { useDispatch } from 'react-redux'

import { RecordActions } from '@webapp/store/ui/record'
import { useIsSurveyDirty } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'
import { Button } from '@webapp/components/buttons'

const FormEditActions = () => {
  const dispatch = useDispatch()
  const surveyIsDirty = useIsSurveyDirty()

  return (
    <div className="survey-form-header__actions">
      <Button
        disabled={surveyIsDirty}
        iconClassName="icon-eye icon-12px"
        label="surveyForm:formEditActions.preview"
        onClick={() => dispatch(RecordActions.createRecord({ preview: true }))}
        size="small"
        testId={TestId.surveyForm.previewOpenBtn}
        variant="text"
      />
    </div>
  )
}

export default FormEditActions
