const R = require('ramda')

const Survey = require('../../../common/survey/survey')
const NodeDef = require('../../../common/survey/nodeDef')
const Record = require('../../../common/record/record')
const RecordValidation = require('../../../common/record/recordValidation')
const Validation = require('../../../common/validation/validation')

const Queue = require('../../../common/queue')

const getNodePath = node => (survey, record) => {
  const nodeDefUuid = Node.getNodeDefUuid(node)
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

  const parentNode = Record.getParentNode(node)(record)
  if (parentNode) {
    const parentNodePath = getNodePath(parentNode)(survey, record)

    if (NodeDef.isMultiple(nodeDef)) {
      const siblings = Record.getNodeChildrenByDefUuid(parentNode, nodeDefUuid)(record)
      const index = R.findIndex(n => Node.getUuid(n) === Node.getUuid(node), siblings)
      const position = index + 1
      return `${parentNodePath}/${NodeDef.getName(nodeDef)}[${position}]`
    } else {
      return `${parentNodePath}/${NodeDef.getName(nodeDef)}`
    }
  } else {
    //is root
    return NodeDef.getName(nodeDef)
  }
}

const findNodeByPath = path => (survey, record) => {
  const parts = R.ifElse(
    R.is(Array),
    R.identity,
    R.split('/')
  )(path)

  let currentNodeDef = null
  let currentNode = null
  let currentParentNode = null
  let currentParentDef = null

  for (const part of parts) {
    if (currentParentNode) {
      //extract node name and position from path part
      const partMatch = /(\w+)(\[(\d+)\])?/.exec(part)
      const childName = partMatch[1]
      const childPosition = R.defaultTo(1, partMatch[3])

      currentNodeDef = Survey.getNodeDefChildByName(currentParentDef, childName)(survey)

      const children = Record.getNodeChildrenByDefUuid(currentParentNode, NodeDef.getUuid(currentNodeDef))(record)

      if (children.length >= childPosition)
        currentNode = children[childPosition - 1]
      else
        return null
    } else {
      currentNodeDef = Survey.getRootNodeDef(survey)
      currentNode = Record.getRootNode(record)
    }
    currentParentDef = currentNodeDef
    currentParentNode = currentNode
  }

  return currentNode
}

const traverse = visitorFn => async record => {
  const root = Record.getRootNode(record)
  const queue = new Queue()
  queue.enqueue(root)

  while (!queue.isEmpty()) {
    const node = queue.dequeue()

    await visitorFn(node)

    const children = Record.getNodeChildren(node)(record)

    queue.enqueueItems(children)
  }
}

const getValidationMinCount = (parentNode, childDef) => R.pipe(
  Validation.getValidation,
  RecordValidation.getValidationChildrenCount(parentNode, childDef),
  Validation.getFieldValidation(RecordValidation.keys.minCount)
)

const getValidationMaxCount = (parentNode, childDef) => R.pipe(
  Validation.getValidation,
  RecordValidation.getValidationChildrenCount(parentNode, childDef),
  Validation.getFieldValidation(RecordValidation.keys.maxCount)
)

module.exports = {
  getNodePath,
  getValidationMinCount,
  getValidationMaxCount,

  findNodeByPath,
  traverse,
}