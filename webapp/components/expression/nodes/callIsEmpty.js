import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'

import * as Expression from '@core/expressionParser/expression'

import { Button } from '@webapp/components/buttons'

import Identifier from './identifier'

export const CallIsEmpty = (props) => {
  const { onConfirm: onConfirmProp, variables } = props

  const [state, setState] = useState({
    identifier: null,
    dirty: true,
  })

  const { dirty, identifier } = state

  const buildFunctionCall = useCallback(() => {
    const params = [identifier]
    return Expression.newCall({ callee: Expression.functionNames.isEmpty, params })
  }, [identifier])

  const onConfirm = useCallback(() => {
    onConfirmProp(buildFunctionCall())
    setState((statePrev) => ({ ...statePrev, dirty: false }))
  }, [buildFunctionCall, onConfirmProp])

  const onIdentifierChange = useCallback((identifierUpdated) => {
    setState((statePrev) => ({
      ...statePrev,
      dirty: true,
      identifier: identifierUpdated?.name ? { type: Expression.types.Identifier, ...identifierUpdated } : null,
    }))
  }, [])

  return (
    <>
      <Identifier node={identifier} onChange={onIdentifierChange} variables={variables} />
      <Button disabled={!dirty || !identifier} label="common.apply" onClick={onConfirm} />
    </>
  )
}

CallIsEmpty.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  variables: PropTypes.array.isRequired,
}
