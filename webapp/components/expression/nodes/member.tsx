import * as Expression from '@core/expressionParser/expression'

import Identifier from './identifier'

type MemberProps = {
  // Common props
  node: any
  onChange: (...args: any[]) => any
  // Identifier / Member / Call
  variables?: any[]
}

const Member = ({ node, variables, onChange }: MemberProps) => {
  const nodeIdentifier = {
    type: Expression.types.Identifier,
    name: Expression.toString(node),
  }

  return <Identifier node={nodeIdentifier} variables={variables} onChange={onChange} />
}

export default Member
