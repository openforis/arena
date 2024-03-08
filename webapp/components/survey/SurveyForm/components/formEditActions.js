import React from 'react'
import { useDispatch } from 'react-redux'

import { useI18n } from '@webapp/store/system'
import { RecordActions } from '@webapp/store/ui/record'
import { TestId } from '@webapp/utils/testId'

const FormEditActions = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()

  return (
    <div className="survey-form-header__actions">
      <button
        type="button"
        className="btn-s btn-transparent"
        onClick={() => dispatch(RecordActions.createRecord({ preview: true }))}
        data-testid={TestId.surveyForm.previewOpenBtn}
      >
        <span className="icon icon-eye icon-12px icon-left" />
        {i18n.t('surveyForm.formEditActions.preview')}
      </button>
    </div>
  )
}

export default FormEditActions
