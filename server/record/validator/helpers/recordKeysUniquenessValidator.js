const R = require('ramda')
const Promise = require('bluebird')

const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const Record = require('../../../../common/record/record')
const Node = require('../../../../common/record/node')
const Validator = require('../../../../common/validation/validator')

const NodeRepository = require('../../nodeRepository')
const RecordRepository = require('../../recordRepository')

const errorKeys = {
  duplicateRecord: 'duplicateRecord'
}

const validateKeysUniqueness = async (survey, recordUuid, tx) => {
  const surveyId = Survey.getId(survey)
  const rootDef = Survey.getRootNodeDef(survey)
  const keyDefs = Survey.getNodeDefKeys(rootDef)(survey)

  const rootNode = await NodeRepository.fetchChildNodeByNodeDefUuid(surveyId, recordUuid, null, NodeDef.getUuid(rootDef), tx)

  // 1. find record key nodes
  const keyNodes = await Promise.all(
    keyDefs.map(
      async keyDef =>
        await NodeRepository.fetchChildNodeByNodeDefUuid(surveyId, recordUuid, Node.getUuid(rootNode), NodeDef.getUuid(keyDef), tx)
    )
  )

  if (R.any(Node.isNodeValueBlank, keyNodes)) {
    return {} //TODO check record duplication even when there are empty keys
  }

  const keyValues = keyNodes.map(Node.getNodeValue) //TODO convert value to RDB column values

  // 2. find records with the same key values
  const recordsSameKeys = await RecordRepository.fetchRecordsBySurveyIdAndKeys(surveyId, rootDef, keyDefs, keyValues, tx)

  // 3. consider only records uuid different from the specified 'recordUuid'

  const otherRecordsWithSameKeys = R.reject(R.propEq(Record.keys.uuid, recordUuid), recordsSameKeys)

  // 4. give an error if there is at least one duplicate record
  return R.isEmpty(otherRecordsWithSameKeys)
    ? {}
    : (
      R.pipe(
        R.map(n => ({
            [Node.getUuid(n)]: {
              [Validator.keys.fields]: {
                [Node.keys.value]: {
                  [Validator.keys.errors]: [errorKeys.duplicateRecord]
                }
              }
            }
          })
        ),
        R.mergeAll
      )(keyNodes)
    )
}

module.exports = {
  validateKeysUniqueness
}