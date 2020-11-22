import React from 'react'
import PropTypes from 'prop-types'

import * as Expression from '@core/expressionParser/expression'

import Identifier from './identifier'

const Call = ({ node, variables, variablesGroupedByParentUuid, onChange }) => {
  const nodeIdentifier = {
    type: Expression.types.Identifier,
    name: Expression.toString(node),
  }

  return (
    <Identifier
      node={nodeIdentifier}
      variables={variables}
      variablesGroupedByParentUuid={variablesGroupedByParentUuid}
      onChange={onChange}
    />
  )
}

Call.propTypes = {
  // Common props
  node: PropTypes.any.isRequired,
  onChange: PropTypes.func.isRequired,
  // Identifier / Member / Call
  variables: PropTypes.array,
  variablesGroupedByParentUuid: PropTypes.array,
}

Call.defaultProps = {
  variables: null,
  variablesGroupedByParentUuid: null,
}

export default Call
