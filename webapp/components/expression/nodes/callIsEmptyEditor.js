import React from 'react'
import PropTypes from 'prop-types'

import * as Expression from '@core/expressionParser/expression'

import { CallSingleParameterEditor } from './callSingleParameterEditor'

const isEmptyCallCreator = (identifier) => {
  const params = [identifier]
  return Expression.newCall({ callee: Expression.functionNames.isEmpty, params })
}

export const CallIsEmptyEditor = (props) => {
  const { expressionNode, onConfirm, variables } = props
  return (
    <CallSingleParameterEditor
      expressionNode={expressionNode}
      functionCallCreator={isEmptyCallCreator}
      onConfirm={onConfirm}
      variables={variables}
    />
  )
}

CallIsEmptyEditor.propTypes = {
  expressionNode: PropTypes.object,
  onConfirm: PropTypes.func.isRequired,
  variables: PropTypes.array.isRequired,
}
