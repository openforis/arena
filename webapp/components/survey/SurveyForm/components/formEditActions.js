import React from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import { useI18n } from '@webapp/store/system'

import { RecordActions } from '@webapp/store/ui/record'

const FormEditActions = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const history = useHistory()

  return (
    <div className="survey-form-header__actions">
      <button
        type="button"
        className="btn-s btn-transparent"
        onClick={() => dispatch(RecordActions.createRecord(history, true))}
      >
        <span className="icon icon-eye icon-12px icon-left" />
        {i18n.t('surveyForm.formEditActions.preview')}
      </button>
    </div>
  )
}

export default FormEditActions
