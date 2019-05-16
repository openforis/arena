import React, { useContext } from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import AppContext from '../../../../app/appContext'

import { createRecord } from '../../record/actions'

const FormEditActions = ({ history, createRecord }) => {
  const { i18n } = useContext(AppContext)

  return (
    <div className="survey-form__nav-record-actions">
      <button className="btn btn-of" onClick={() => createRecord(history, true)}>
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
