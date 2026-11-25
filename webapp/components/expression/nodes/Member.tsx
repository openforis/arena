import * as Expression from '@core/expressionParser/expression'

import Identifier from './Identifier'
import type { ExpressionNodeProps } from './expressionNode'

type MemberProps = Pick<ExpressionNodeProps, 'node' | 'onChange' | 'variables'>

const Member = ({ node, variables, onChange }: MemberProps) => {
  const nodeIdentifier = {
    type: Expression.types.Identifier,
    name: Expression.toString(node),
  }

  return <Identifier node={nodeIdentifier} variables={variables} onChange={onChange} />
}

export default Member
