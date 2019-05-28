const R = require('ramda')

const Survey = require('../survey/survey')
const NodeDef = require('../survey/nodeDef')
const Record = require('./record')
const Node = require('./node')
const Validator = require('../validation/validator')

const CountValidator = require('./_recordValidator/countValidator')
const AttributeValidator = require('./_recordValidator/attributeValidator')
const EntityUniquenessValidator = require('./_recordValidator/entityUniquenessValidator')

const validateNodes = async (survey, record, nodes) => {

  // 1. validate self and dependent attributes (validations/expressions)
  const attributeValidations = await AttributeValidator.validateSelfAndDependentAttributes(survey, record, nodes)

  // 2. validate min/max count
  const nodeCountValidations = CountValidator.validateChildrenCountNodes(survey, record, nodes)

  // 3. validate entity keys uniqueness
  const entityKeysValidations = EntityUniquenessValidator.validateEntitiesUniquenessInNodes(survey, record, nodes)

  // 4. merge validations
  const validation = {
    [Validator.keys.fields]: R.pipe(
      R.mergeDeepLeft(nodeCountValidations),
      R.mergeDeepLeft(entityKeysValidations)
    )(attributeValidations)
  }

  return Validator.recalculateValidity(validation)
}

const validateRecord = async (survey, record) => {

  // 1. validate attributes (validations/expressions)
  // _log('validate attributes start')
  const attributeValidations = {}
  const { root } = Survey.getHierarchy()(survey)
  Survey.traverseHierarchyItem(root, async nodeDefEntity => {
    const nodeDefChildren = Survey.getNodeDefChildren(nodeDefEntity)(survey)
    const nodeDefAttributes = nodeDefChildren.filter(NodeDef.isAttribute)
    for (const nodeDefAttribute of nodeDefAttributes) {
      const attributes = Record.getNodesByDefUuid(NodeDef.getUuid(nodeDefAttribute))(record)
      for (const attribute of attributes) {
        const validation = await AttributeValidator.validateAttribute(survey, record, attribute, nodeDefAttribute)
        if (validation)
          attributeValidations[Node.getUuid(attribute)] = validation
      }
    }
  })
  // _log('validate attributes end')

  // 2. validate min/max count
  // _log('validate children count start')
  const nodeCountValidations = CountValidator.validateChildrenCountRecord(survey, record)
  // _log('validate children count end')

  // 3. validate entity keys uniqueness
  // _log('validate entities uniqueness start')
  const entityKeysValidations = EntityUniquenessValidator.validateEntitiesUniquenessInRecord(survey, record)
  // _log('validate entities uniqueness end')

  // 4. merge validations
  // _log('merge validation start')
  const validation = {
    [Validator.keys.fields]: R.pipe(
      R.mergeDeepLeft(nodeCountValidations),
      R.mergeDeepLeft(entityKeysValidations)
    )(attributeValidations)
  }
  // _log('merge validation end')

  return Validator.recalculateValidity(validation)
}

//const _log = message => console.log(`${new Date().getTime()} - ${message}`)

module.exports = {
  validateNodes,
  validateRecord,
  validateAttribute: AttributeValidator.validateAttribute,
  validateChildrenCount: CountValidator.validateChildrenCount
}