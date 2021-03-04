import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as Expression from '@core/expressionParser/expression'

export const recordExpressionFunctions = ({ record }) => ({
  [Expression.functionNames.index]: (node) => {
    if (!node) {
      return -1
    }
    if (Node.isRoot(node)) {
      return 0
    }
    const nodeParent = Record.getParentNode(node)(record)
    if (!nodeParent) {
      return -1
    }
    const children = Record.getNodeChildrenByDefUuid(nodeParent, Node.getNodeDefUuid(node))(record)
    return children.findIndex(Node.isEqual(node))
  },
  [Expression.functionNames.parent]: (node) => {
    if (!node || Node.isRoot(node)) {
      return null
    }
    return Record.getParentNode(node)(record)
  },
})
