import './ServiceErrors.scss'

import React from 'react'
import * as R from 'ramda'
import { CSSTransition, TransitionGroup } from 'react-transition-group'

import { useServiceErrors } from '@webapp/store/system'

import ServiceError from './ServiceError'

const ServiceErrors = () => {
  const errors = useServiceErrors()
  return (
    <TransitionGroup className={`service-errors${R.isEmpty(errors) ? ' hidden-transition' : ''}`} enter appear>
      {errors.map((error) => (
        <CSSTransition key={error.id} timeout={500} classNames="fade">
          <ServiceError error={error} />
        </CSSTransition>
      ))}
    </TransitionGroup>
  )
}

export default ServiceErrors
