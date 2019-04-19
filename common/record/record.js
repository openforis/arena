const R = require('ramda')
const { uuidv4 } = require('./../uuid')

const Survey = require('../survey/survey')
const SurveyUtils = require('../survey/surveyUtils')
const NodeDef = require('../survey/nodeDef')
const Validator = require('../validation/validator')
const Node = require('../record/node')
const User = require('../user/user')
const RecordStep = require('./recordStep')
const RecordValidation = require('./recordValidation')

const Queue = require('../queue')

const keys = {
  uuid: 'uuid',
  nodes: 'nodes',
  ownerId: 'ownerId',
  step: 'step',
  preview: 'preview',
}
// ====== CREATE

const newRecord = (user, preview = false) => ({
  [keys.uuid]: uuidv4(),
  [keys.ownerId]: User.getId(user),
  [keys.step]: RecordStep.getDefaultStep(),
  [keys.preview]: preview
})

// ====== READ
const getNodes = R.propOr({}, keys.nodes)

const getNodesArray = R.pipe(
  getNodes,
  R.values,
)

const findNodes = predicate => R.pipe(
  getNodesArray,
  R.filter(predicate)
  // R.sort((n1, n2) => {
  //   return !n1.id
  //     ? 1
  //     : !n2.id
  //       ? -1
  //       : Number(n1.id) < Number(n2.id)
  // }),
)

const findNodesIndexed = predicate => R.pipe(
  getNodes,
  R.filter(predicate)
)

const getNodeChildren = node => findNodes(n => Node.getParentUuid(n) === Node.getUuid(node))

const getNodeChildrenByDefUuid = (parentNode, nodeDefUuid) => record => R.pipe(
  getNodeChildren(parentNode),
  R.filter(n => Node.getNodeDefUuid(n) === nodeDefUuid),
  // Put placeholder at the end for multiple nodes if another user is editing the same record
  R.sortWith([
    R.propOr(false, Node.keys.placeholder),
    R.prop(Node.keys.id)
  ])
)(record)

const getNodeSiblingsByDefUuid = (node, siblingDefUuid) => R.pipe(
  getParentNode(node),
  parentNode => getNodeChildrenByDefUuid(parentNode, siblingDefUuid)
)

const getNodesByDefUuid = nodeDefUuid =>
  findNodes(n => Node.getNodeDefUuid(n) === nodeDefUuid)

const getRootNode = R.pipe(
  getNodesArray,
  R.find(R.propEq(Node.keys.parentUuid, null)),
)

const getNodeByUuid = uuid => R.path([keys.nodes, uuid])

const getParentNode = node => getNodeByUuid(Node.getParentUuid(node))

const getAncestorEntitiesAndSelf = entity =>
  record => {
    const ancestors = []

    let parent = entity
    while (parent) {
      ancestors.push(parent)
      parent = getParentNode(parent)(record)
    }
    return ancestors
  }

const findNodeInAncestorEntities = (parentNode, predicate) => record => {
  const ancestors = getAncestorEntitiesAndSelf(parentNode)(record)
  for (const ancestor of ancestors) {
    const children = getNodeChildren(ancestor)(record)
    for (const child of children) {
      if (predicate(child)) {
        return child
      }
    }
  }
  return null
}

const getParentCodeAttribute = (survey, parentNode, nodeDef) =>
  record => {
    const parentCodeDef = Survey.getNodeDefByUuid(NodeDef.getParentCodeDefUuid(nodeDef))(survey)

    return parentCodeDef
      ? findNodeInAncestorEntities(parentNode,
        node => Node.getNodeDefUuid(node) === NodeDef.getUuid(parentCodeDef)
      )(record)
      : null
  }

const getCodeUuidsHierarchy = (survey, parentEntity, nodeDef) => record => {
  const parentCode = getParentCodeAttribute(survey, parentEntity, nodeDef)(record)

  return parentCode
    ? R.append(
      Node.getUuid(parentCode),
      getCodeUuidsHierarchy(
        survey,
        getParentNode(parentCode)(record),
        Survey.getNodeDefByUuid(Node.getNodeDefUuid(parentCode))(survey)
      )(record),
    )
    : []
}

const getDependentCodeAttributes = node => findNodes(n => {
  const hierarchy = Node.getCategoryItemHierarchy(n)
  return R.includes(Node.getUuid(node), hierarchy)
})

const getAncestorByNodeDefUuuid = (node, ancestorDefUuid) =>
  record => {
    const parentNode = getParentNode(node)(record)

    return R.pipe(
      getAncestorEntitiesAndSelf(parentNode),
      R.find(ancestor => Node.getNodeDefUuid(ancestor) === ancestorDefUuid)
    )(record)
  }

const getDescendantsByNodeDefUuid = (node, descendantDefUuid) =>
  findNodes(
    R.and(
      Node.isDescendantOf(node),
      n => Node.getNodeDefUuid(n) === descendantDefUuid
    )
  )

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

      const children = getNodeChildrenByDefUuid(currentParentNode, NodeDef.getUuid(currentNodeDef))(record)

      if (children.length >= childPosition)
        currentNode = children[childPosition - 1]
      else
        return null
    } else {
      currentNodeDef = Survey.getRootNodeDef(survey)
      currentNode = getRootNode(record)
    }
    currentParentDef = currentNodeDef
    currentParentNode = currentNode
  }

  return currentNode
}

const getNodePath = node => (survey, record) => {
  const nodeDefUuid = Node.getNodeDefUuid(node)
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

  const parentNode = getParentNode(node)(record)
  if (parentNode) {
    const parentNodePath = getNodePath(parentNode)(survey, record)

    if (NodeDef.isMultiple(nodeDef)) {
      const siblings = getNodeChildrenByDefUuid(parentNode, nodeDefUuid)(record)
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

const traverse = visitorFn => async record => {
  const root = getRootNode(record)
  const queue = new Queue()
  queue.enqueue(root)

  while (!queue.isEmpty()) {
    const node = queue.dequeue()

    await visitorFn(node)

    const children = getNodeChildren(node)(record)

    queue.enqueueItems(children)
  }
}

// ====== UPDATE

const assocNodes = nodes =>
  record => {
    // exclude dirty nodes currently being edited by the user

    const dirtyNodes = findNodesIndexed(Node.isDirty)(record)

    const nodesToUpdate = R.pipe(
      R.filter(
        n => {
          const dirtyNode = R.prop(Node.getUuid(n), dirtyNodes)
          return !dirtyNode ||
            Node.isDirty(n) ||
            R.equals(Node.getValue(dirtyNode), Node.getValue(n)) ||
            Node.isValueBlank(dirtyNode) && Node.isDefaultValueApplied(n)
        }),
      R.map(
        R.omit([Node.keys.updated, Node.keys.created])
      )
    )(nodes)

    return R.pipe(
      getNodes,
      R.mergeLeft(nodesToUpdate),
      mergedNodes => R.assoc(keys.nodes, mergedNodes)(record),
      removeDeletedNodes,
    )(record)
  }

const removeDeletedNodes = record => {
  const deletedNodes = findNodes(R.propEq(Node.keys.deleted, true))(record)

  return R.reduce(
    (updatedRecord, node) => deleteNode(node)(updatedRecord),
    record,
    deletedNodes
  )
}

// ====== DELETE
const deleteNode = node =>
  record => {
    const nodeUuid = Node.getUuid(node)

    // 1. remove node from record
    const recordUpdated = R.pipe(
      getNodes,
      R.dissoc(nodeUuid),
      newNodes => R.assoc(keys.nodes, newNodes, record),
    )(record)

    // 2. update validation
    const recordValidationUpdated = R.pipe(
      Validator.getValidation,
      Validator.dissocFieldValidation(nodeUuid),
      newValidation => Validator.assocValidation(newValidation)(recordUpdated)
    )(recordUpdated)

    // 3. remove entity children recursively
    const children = getNodeChildren(node)(recordValidationUpdated)

    return R.reduce(
      (recordCurrent, child) => deleteNode(child)(recordCurrent),
      recordValidationUpdated,
      children
    )
  }

module.exports = {
  keys,

  // ====== CREATE
  newRecord,

  // ====== READ
  getUuid: SurveyUtils.getUuid,
  isPreview: R.propEq(keys.preview, true),
  getOwnerId: R.prop(keys.ownerId),
  getStep: R.prop(keys.step),

  getNodes,
  getNodesArray,
  getNodesByDefUuid,
  getNodeChildrenByDefUuid,
  getNodeSiblingsByDefUuid,
  getRootNode,
  getNodeByUuid,
  getParentNode,
  getAncestorEntitiesAndSelf,
  getAncestorByNodeDefUuuid,
  getDescendantsByNodeDefUuid,
  findNodeByPath,
  getNodePath,
  traverse,

  // testing
  getCodeUuidsHierarchy,
  getParentCodeAttribute,
  getDependentCodeAttributes,

  // ====== UPDATE
  assocNodes,
  assocNode: node => assocNodes({ [Node.getUuid(node)]: node }),
  mergeNodeValidations: Validator.mergeValidation,

  // ====== DELETE

  deleteNode,

  // ====== VALIDATION
  getValidation: Validator.getValidation,
  getValidationChildrenCount: (parentNode, childDef) => R.pipe(Validator.getValidation, RecordValidation.getChildrenCountValidation(parentNode, childDef)),
  getValidationMinCount: (parentNode, childDef) => R.pipe(Validator.getValidation, RecordValidation.getValidationMinCount(parentNode, childDef)),
  getValidationMaxCount: (parentNode, childDef) => R.pipe(Validator.getValidation, RecordValidation.getValidationMaxCount(parentNode, childDef)),
}