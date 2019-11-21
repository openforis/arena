import React from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import { useI18n } from '@webapp/commonComponents/hooks'

import { createRecord } from '@webapp/loggedin/surveyViews/record/actions'

const FormEditActions = ({ history, createRecord }) => {
  const i18n = useI18n()

  return (
    <div className="survey-form-header__actions">
      <button className="btn-s btn-transparent" onClick={() => createRecord(history, true)}>
        <span className="icon icon-eye icon-12px icon-left"/>
        {i18n.t('surveyForm.formEditActions.preview')}
      </button>
    </div>
  )
}

const enhance = compose(
  withRouter,
  connect(null, { createRecord })
)

export default enhance(FormEditActions)
