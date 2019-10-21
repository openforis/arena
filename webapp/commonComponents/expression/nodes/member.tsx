import React from 'react'

import Expression from '../../../../core/exprParser/expression'

import { Identifier } from './internal'

export const Member = ({ node, variables, onChange }) => {

  const nodeIdentifier = {
    type: Expression.types.Identifier,
    name: Expression.toString(node)
  }

  return (
    <Identifier node={nodeIdentifier}
                variables={variables}
                onChange={onChange}/>
  )
}

export default Member
