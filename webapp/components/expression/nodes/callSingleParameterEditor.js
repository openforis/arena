import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'

import * as Expression from '@core/expressionParser/expression'

import Identifier from './identifier'

export const CallSingleParameterEditor = (props) => {
  const { functionCallCreator, expressionNode, onConfirm: onConfirmProp, variables } = props

  const initialIdentifierName = expressionNode?.arguments?.[0]?.value
  const initialIdentifier = initialIdentifierName ? Expression.newIdentifier(initialIdentifierName) : null

  const [state, setState] = useState({
    identifier: initialIdentifier,
  })

  const { identifier } = state

  const onIdentifierChange = useCallback(
    (identifierUpdated) => {
      const identifierNext = identifierUpdated?.name
        ? { type: Expression.types.Identifier, ...identifierUpdated }
        : null
      setState((statePrev) => ({ ...statePrev, identifier: identifierNext }))
      onConfirmProp(functionCallCreator(identifierNext))
    },
    [functionCallCreator, onConfirmProp]
  )

  return <Identifier node={identifier} onChange={onIdentifierChange} variables={variables} />
}

CallSingleParameterEditor.propTypes = {
  expressionNode: PropTypes.object,
  functionCallCreator: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  variables: PropTypes.array.isRequired,
}
