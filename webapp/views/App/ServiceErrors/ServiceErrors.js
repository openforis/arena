/* eslint-disable react-hooks/refs */
import * as R from 'ramda'
import React, { createRef, useMemo, useRef } from 'react'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import './ServiceErrors.scss'

import { useServiceErrors } from '@webapp/store/system'

import ServiceError from './ServiceError'

const ServiceErrors = () => {
  const errors = useServiceErrors()

  const nodeMapRef = useRef(new Map())

  const itemsWithRefs = useMemo(() => {
    const nodeMap = nodeMapRef.current
    const errorIds = new Set(errors.map((e) => e.id))

    // 1. Cleanup: Remove refs for errors that no longer exist
    for (const id of nodeMap.keys()) {
      if (!errorIds.has(id)) {
        nodeMap.delete(id)
      }
    }

    // 2. Map: Ensure every current error has a stable React ref
    return errors.map((error) => {
      let nodeRef = null
      if (!nodeMap.has(error.id)) {
        nodeRef = createRef()
        nodeMap.set(error.id, nodeRef)
      }
      nodeRef = nodeMap.get(error.id)
      return {
        error,
        nodeRef,
      }
    })
  }, [errors]) // Only re-runs when the errors array changes

  return (
    <TransitionGroup className={`service-errors${R.isEmpty(errors) ? ' hidden-transition' : ''}`} enter appear>
      {itemsWithRefs.map(({ error, nodeRef }) => (
        <CSSTransition key={error.id} timeout={500} classNames="fade" nodeRef={nodeRef}>
          <ServiceError error={error} nodeRef={nodeRef} />
        </CSSTransition>
      ))}
    </TransitionGroup>
  )
}

export default ServiceErrors
