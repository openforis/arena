const R = require('ramda')

const Survey = require('../../../../../common/survey/survey')
const NodeDef = require('../../../../../common/survey/nodeDef')

const Record = require('../../../../../common/record/record')
const RecordValidator = require('../../../../../common/record/recordValidator')
const Node = require('../../../../../common/record/node')
const Validator = require('../../../../../common/validation/validator')

const RecordRepository = require('../../repository/recordRepository')

const RecordUniquenessValidator = require('./recordUniquenessValidator')

const validateRecordAndPersistValidation = async (survey, record, tx) => {
  // 1. validate nodes
  const nodesValidation = await RecordValidator.validateRecord(survey, record)

  // 2. validate record keys uniqueness
  const recordKeysValidation = await RecordUniquenessValidator.validateRecordKeysUniqueness(survey, record, tx)

  // 3. merge validations
  const validation = Validator.recalculateValidity(
    R.mergeDeepLeft(
      {
        [Validator.keys.fields]: recordKeysValidation
      },
      nodesValidation
    )
  )

  // 4. persist validation
  await persistValidation(survey, record, validation, tx)

  return validation
}

const validateNodesAndPersistValidation = async (survey, record, nodes, tx) => {

  // 1. validate nodes
  const nodesValidation = await RecordValidator.validateNodes(survey, record, nodes)

  // 2. validate record keys uniqueness
  const recordKeysValidation = !Record.isPreview(record) && isRootNodeKeysUpdated(survey, nodes)
    ? await RecordUniquenessValidator.validateRecordKeysUniqueness(survey, record, tx)
    : {}

  // 3. merge validations
  const validation = Validator.recalculateValidity(
    R.mergeDeepLeft(
      {
        [Validator.keys.fields]: recordKeysValidation
      },
      nodesValidation
    )
  )

  // 4. persist validation
  await persistValidation(survey, record, validation, tx)

  return validation
}

const isRootNodeKeysUpdated = (survey, nodes) => R.pipe(
  R.values,
  R.any(n => {
      const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(n))(survey)
      const parentDef = Survey.getNodeDefParent(nodeDef)(survey)
      return NodeDef.isKey(nodeDef) && NodeDef.isRoot(parentDef)
    },
  )
)(nodes)

const persistValidation = async (survey, record, nodesValidation, tx) => {
  const surveyId = Survey.getId(survey)

  const recordValidationUpdated = R.pipe(
    Validator.mergeValidation(nodesValidation),
    Validator.getValidation
  )(record)

  await RecordRepository.updateValidation(surveyId, Record.getUuid(record), recordValidationUpdated, tx)
}

module.exports = {
  persistValidation,
  validateNodesAndPersistValidation,
  validateRecordAndPersistValidation,
  validateRecordKeysUniqueness: RecordUniquenessValidator.validateRecordKeysUniqueness
}