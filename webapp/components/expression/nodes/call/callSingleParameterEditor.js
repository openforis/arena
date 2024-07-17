import React, { useCallback, useState } from 'react'

import * as Expression from '@core/expressionParser/expression'

import Identifier from '../identifier'
import { CallEditorPropTypes } from './callEditorPropTypes'

export const CallSingleParameterEditor = (props) => {
  const { callee, expressionNode, onConfirm: onConfirmProp, variables, variablesFilterFn } = props

  const initialIdentifierName = expressionNode?.arguments?.[0]?.name
  const initialIdentifier = initialIdentifierName ? Expression.newIdentifier(initialIdentifierName) : null

  const [state, setState] = useState({
    identifier: initialIdentifier,
  })

  const { identifier } = state

  const createFunctionCall = useCallback(
    (identifierNext) => Expression.newCall({ callee, params: [identifierNext] }),
    [callee]
  )

  const onIdentifierChange = useCallback(
    (identifierUpdated) => {
      const identifierNext = identifierUpdated?.name
        ? { type: Expression.types.Identifier, ...identifierUpdated }
        : null
      setState((statePrev) => ({ ...statePrev, identifier: identifierNext }))
      onConfirmProp(createFunctionCall(identifierNext))
    },
    [createFunctionCall, onConfirmProp]
  )

  return (
    <Identifier
      node={identifier}
      onChange={onIdentifierChange}
      variables={variables}
      variablesFilterFn={variablesFilterFn}
    />
  )
}

CallSingleParameterEditor.propTypes = CallEditorPropTypes
