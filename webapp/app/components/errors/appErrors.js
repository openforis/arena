import './appErrors.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { getAppErrors, getAppState } from '../../appState'

import { closeAppError } from '../../actions'

const AppError = ({error, closeAppError}) => (
  <div className="app-errors__error">

    <button className="btn-s btn-close"
            onClick={() => closeAppError(error)}>
      <span className="icon icon-cross icon-12px"/>
    </button>

    <div className="status">
      ERROR {R.path(['response', 'status'], error)}
    </div>
    <div className="message">
      {R.prop('message', error)}
    </div>
  </div>
)

const AppErrors = ({errors, closeAppError}) => R.isEmpty(errors)
  ? null
  : (
    <div className="app-errors">
      {
        errors.map(error =>
          <AppError key={error.id}
                    error={error}
                    closeAppError={closeAppError}/>
        )
      }
    </div>
  )

const mapStateToProps = (state) => {
  const errors = R.pipe(
    getAppState,
    getAppErrors,
  )(state)

  return {
    errors
  }
}

export default connect(
  mapStateToProps, {closeAppError}
)(AppErrors)