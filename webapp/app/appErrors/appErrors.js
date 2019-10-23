import './appErrors.scss'

import React from 'react'
import { connect } from 'react-redux'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import Markdown from '../../utils/markdown'

import * as R from 'ramda'

import { useI18n } from '../../commonComponents/hooks'

import * as ErrorsState from './appErrorsState'

import { closeAppError } from './actions'

const AppError = ({ error, closeAppError }) => {

  const i18n = useI18n()
  const { key, params } = R.path(['response', 'data'], error)

  return (
    <div className="app-errors__error">

      <button className="btn-s btn-close"
              onClick={() => closeAppError(error)}>
        <span className="icon icon-cross icon-12px"/>
      </button>

      <div className="status">
        ERROR {R.path(['response', 'status'], error)}
      </div>
      <Markdown className="message" source={i18n.t(key, params)}/>
    </div>
  )
}
const AppErrors = ({ errors, closeAppError }) => (
  <TransitionGroup
    className={`app-errors${R.isEmpty(errors) ? ' hidden-transition' : ''}`}
    enter={true}
    appear={true}>
    {
      errors.map(error =>
        <CSSTransition
          key={error.id}
          timeout={500}
          classNames="fade">
          <AppError
            error={error}
            closeAppError={closeAppError}/>
        </CSSTransition>
      )
    }
  </TransitionGroup>
)

const mapStateToProps = (state) => ({
  errors: ErrorsState.getAppErrors(state)
})

export default connect(
  mapStateToProps, { closeAppError }
)(AppErrors)