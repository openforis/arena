import './ServiceErrors.scss'
import React, { createRef, useEffect, useRef } from 'react'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import * as R from 'ramda'

import { useServiceErrors } from '@webapp/store/system'

import ServiceError from './ServiceError'

const ServiceErrors = () => {
  const errors = useServiceErrors()

  const nodeRefs = useRef(new Map()).current

  const getRef = (id) => {
    if (!nodeRefs.has(id)) {
      nodeRefs.set(id, createRef())
    }
    return nodeRefs.get(id)
  }

  useEffect(() => {
    const errorIds = new Set(errors.map((error) => error.id))
    for (const id of nodeRefs.keys()) {
      if (!errorIds.has(id)) {
        nodeRefs.delete(id)
      }
    }
  }, [errors])

  return (
    <TransitionGroup className={`service-errors${R.isEmpty(errors) ? ' hidden-transition' : ''}`} enter appear>
      {errors.map((error) => {
        const nodeRef = getRef(error.id)

        return (
          <CSSTransition
            key={error.id}
            timeout={500}
            classNames="fade"
            // FIX: Pass the ref to CSSTransition (to avoid use of ReactDOM.findDOMNode)
            nodeRef={nodeRef}
          >
            <ServiceError ref={nodeRef} error={error} />
          </CSSTransition>
        )
      })}
    </TransitionGroup>
  )
}

export default ServiceErrors
