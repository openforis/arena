const R = require('ramda')
const Promise = require('bluebird')

const Survey = require('../../../common/survey/survey')
const NodeDef = require('../../../common/survey/nodeDef')

const Node = require('../../../common/record/node')
const Validator = require('../../../common/validation/validator')

const RecordRepository = require('../recordRepository')
const NodeRepository = require('../nodeRepository')

const CountValidator = require('./helpers/countValidator')
const DependentsValidator = require('./helpers/dependentNodesValidator')
const RecordKeysUniquenessValidator = require('./helpers/recordKeysUniquenessValidator')

const validateNodes = async (survey, recordUuid, nodes, preview, tx) => {


  // 1. validate self and dependent nodes (validations/expressions)
  const nodesDependentValidations = await DependentsValidator.validateSelfAndDependentNodes(survey, recordUuid, nodes, tx)

  // 2. validate min/max count
  const nodePointers = await fetchNodePointers(survey, nodes, tx)
  const nodeCountValidations = await CountValidator.validateChildrenCount(survey, recordUuid, nodePointers, tx)

  // 3. validate record keys uniqueness
  const recordKeysUniquenessValidations = !preview && isNodeKeyUpdated(survey, nodes)
    ? await RecordKeysUniquenessValidator.validateKeysUniqueness(survey, recordUuid, tx)
    : {}

  // 4. merge validations
  const nodesValidation = {
    fields: R.pipe(
      R.mergeLeft(nodeCountValidations),
      R.mergeLeft(recordKeysUniquenessValidations)
    )(nodesDependentValidations)
  }

  // 5. persist validation
  const surveyId = Survey.getId(survey)
  const record = await RecordRepository.fetchRecordByUuid(surveyId, recordUuid, tx)

  const recordValidationUpdated = R.pipe(
    Validator.mergeValidation(nodesValidation),
    Validator.getValidation
  )(record)

  await RecordRepository.updateValidation(surveyId, recordUuid, recordValidationUpdated, tx)

  return nodesValidation
}

const fetchNodePointers = async (survey, nodes, tx) => {
  const nodesArray = R.values(nodes)

  const nodePointers = await Promise.all(
    nodesArray.map(
      async node => {
        const pointers = []
        const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)

        if (NodeDef.isNodeDefEntity(nodeDef)) {
          const childDefs = Survey.getNodeDefChildren(nodeDef)(survey)

          pointers.push(
            childDefs.map(
              childDef => ({
                nodeCtx: node,
                nodeDef: childDef
              })
            )
          )
        }
        if (!NodeDef.isNodeDefRoot(nodeDef)) {
          const parent = await NodeRepository.fetchNodeByUuid(Survey.getId(survey), Node.getParentUuid(node), tx)
          pointers.push({
            nodeCtx: parent,
            nodeDef
          })
        }
        return pointers
      }
    )
  )
  return R.pipe(
    R.flatten,
    R.uniq
  )(nodePointers)
}

const isNodeKeyUpdated = (survey, nodes) => R.pipe(
  R.values,
  R.any(n => {
      const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(n))(survey)
      const parentDef = Survey.getNodeDefParent(nodeDef)(survey)
      return NodeDef.isNodeDefKey(nodeDef) && NodeDef.isNodeDefRoot(parentDef)
    },
  )
)(nodes)

module.exports = {
  validateNodes
}