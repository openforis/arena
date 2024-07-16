import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'

import * as Expression from '@core/expressionParser/expression'

import Identifier from './identifier'

const buildIsEmptyFunctionCall = (identifier) => {
  const params = [identifier]
  return Expression.newCall({ callee: Expression.functionNames.isEmpty, params })
}

export const CallIsEmptyEditor = (props) => {
  const { onConfirm: onConfirmProp, variables } = props

  const [state, setState] = useState({
    identifier: null,
  })

  const { identifier } = state

  const onIdentifierChange = useCallback(
    (identifierUpdated) => {
      const identifierNext = identifierUpdated?.name
        ? { type: Expression.types.Identifier, ...identifierUpdated }
        : null
      setState((statePrev) => ({ ...statePrev, identifier: identifierNext }))
      onConfirmProp(buildIsEmptyFunctionCall(identifierNext))
    },
    [onConfirmProp]
  )

  return <Identifier node={identifier} onChange={onIdentifierChange} variables={variables} />
}

CallIsEmptyEditor.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  variables: PropTypes.array.isRequired,
}
