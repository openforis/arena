import React from 'react'
import PropTypes from 'prop-types'

import * as Expression from '@core/expressionParser/expression'

import Identifier from './identifier'

const Member = ({ node, variables, onChange }) => {
  const nodeIdentifier = {
    type: Expression.types.Identifier,
    name: Expression.toString(node),
  }

  return <Identifier node={nodeIdentifier} variables={variables} onChange={onChange} />
}

Member.propTypes = {
  // Common props
  node: PropTypes.any.isRequired,
  onChange: PropTypes.func.isRequired,
  // Identifier / Member / Call
  variables: PropTypes.array,
}

export default Member
