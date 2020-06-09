// TODO: This becomes serviceErrors.js
import './appErrors.scss'

import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import * as R from 'ramda'

import { useI18n, ServiceErrorActions, useServiceErrors } from '@webapp/store/system'

import Markdown from '../../components/markdown'

const AppError = ({ error }) => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const { key, params } = R.path(['response', 'data'], error)

  return (
    <div className="app-errors__error">
      <button className="btn-s btn-close" onClick={() => dispatch(ServiceErrorActions.closeAppError(error))}>
        <span className="icon icon-cross icon-12px" />
      </button>

      <div className="status">ERROR {R.path(['response', 'status'], error)}</div>
      <Markdown className="message" source={i18n.t(key, params)} />
    </div>
  )
}

AppError.propTypes = {
  error: PropTypes.object.isRequired,
}

const AppErrors = () => {
  const { errors } = useServiceErrors()
  return (
    <TransitionGroup className={`app-errors${R.isEmpty(errors) ? ' hidden-transition' : ''}`} enter appear>
      {errors.map((error) => (
        <CSSTransition key={error.id} timeout={500} classNames="fade">
          <AppError error={error} />
        </CSSTransition>
      ))}
    </TransitionGroup>
  )
}

export default AppErrors
