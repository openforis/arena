import React from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import { createRecord } from './../../surveyForm/record/actions'

const FormEditActions = ({ history, createRecord }) => (
  <div className="survey-form__nav-record-actions">
    <button className="btn btn-of" onClick={() => createRecord(history, true)}>
      <span className="icon icon-eye icon-12px icon-left"/>
      Preview
    </button>
  </div>
)

const enhance = compose(
  withRouter,
  connect(null, { createRecord })
)

export default enhance(FormEditActions)
