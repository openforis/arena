import React from 'react'
import { useDispatch } from 'react-redux'

import { RecordActions } from '@webapp/store/ui/record'
import { TestId } from '@webapp/utils/testId'
import { Button } from '@webapp/components/buttons'

const FormEditActions = () => {
  const dispatch = useDispatch()

  return (
    <div className="survey-form-header__actions">
      <Button
        iconClassName="icon-eye icon-12px"
        label="surveyForm.formEditActions.preview"
        onClick={() => dispatch(RecordActions.createRecord({ preview: true }))}
        size="small"
        testId={TestId.surveyForm.previewOpenBtn}
        variant="text"
      />
    </div>
  )
}

export default FormEditActions
