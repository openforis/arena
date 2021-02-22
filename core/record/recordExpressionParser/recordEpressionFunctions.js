import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as Expression from '@core/expressionParser/expression'

export const recordExpressionFunctions = ({ record, node }) => ({
  [Expression.functionNames.index]: () => {
    const nodeContext = Record.getParentNode(node)(record)
    const nodeContextParent = Record.getParentNode(nodeContext)(record)
    const children = Record.getNodeChildrenByDefUuid(nodeContextParent, Node.getNodeDefUuid(nodeContext))(record)
    return children.findIndex(Node.isEqual(nodeContext))
  },
})
