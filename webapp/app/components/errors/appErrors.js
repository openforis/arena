import './appErrors.scss'

import React from 'react'
import { connect } from 'react-redux'
import { CSSTransition, TransitionGroup } from 'react-transition-group'

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

const AppErrors = ({errors, closeAppError}) => (
  <TransitionGroup className={`app-errors${R.isEmpty(errors)?' hidden-transition':''}`}
                   enter={true}
                   appear={true}
                   >
    {
      errors.map(error =>
        <CSSTransition
          key={error.id}
          timeout={500}
          classNames="fade"
        >
          <AppError error={error}
                    closeAppError={closeAppError}/>
        </CSSTransition>
      )
    }
  </TransitionGroup>
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