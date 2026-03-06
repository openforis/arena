import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as RecordValidation from '@core/record/recordValidation'
import * as Node from '@core/record/node'
import * as Validation from '@core/validation/validation'

import * as DataViewRepository from '@server/modules/surveyRdb/repository/dataView'

const createNodesRecordUniqueValidation = ({ nodes, unique, errorKey }) => {
  const validationAcc = {}
  for (const node of nodes) {
    validationAcc[Node.getUuid(node)] = RecordValidation.newValidationRecordDuplicate({ unique, errorKey })
  }
  return validationAcc
}

const validateRecordKeysUniqueness = async ({ survey, record }, tx) => {
  const rootNode = Record.getRootNode(record)
  const unique = await DataViewRepository.isRecordUniqueByKeys({ survey, record }, tx)
  const nodes = Record.getEntityKeyNodes(survey, rootNode)(record)
  return createNodesRecordUniqueValidation({ nodes, unique, errorKey: Validation.messageKeys.record.keyDuplicate })
}

const validateRecordUniqueNodesUniqueness = async ({ survey, record }, tx) => {
  const rootNode = Record.getRootNode(record)
  const unique = await DataViewRepository.isRecordUniqueByUniqueNodes({ survey, record }, tx)
  const nodeDefsUnique = Survey.getNodeDefsRootUnique(survey)
  const nodes = nodeDefsUnique.reduce((nodesAcc, nodeDefUnique) => {
    const nodeUnique = Record.getNodeChildByDefUuid(rootNode, NodeDef.getUuid(nodeDefUnique))(record)
    if (nodeUnique) {
      nodesAcc.push(nodeUnique)
    }
    return nodesAcc
  }, [])
  return createNodesRecordUniqueValidation({
    nodes,
    unique,
    errorKey: Validation.messageKeys.record.uniqueAttributeDuplicate,
  })
}

export const validateRecordUniqueNodes = async ({ survey, record }, tx) => {
  const keysValidation = await validateRecordKeysUniqueness({ survey, record }, tx)
  const uniqueNodesValidation = await validateRecordUniqueNodesUniqueness({ survey, record }, tx)
  return { ...keysValidation, ...uniqueNodesValidation }
}

// Returns an indexed object with recordUuid as key and validation as value
export const validateRecordsUniqueness = async (
  { survey, cycle, nodeDefsUnique, nodesUnique, recordUuidsExcluded, excludeRecordsFromCount, errorKey },
  tx
) => {
  const recordsCountRows = await DataViewRepository.fetchRecordsCountByRootNodesValue(
    { survey, cycle, nodeDefs: nodeDefsUnique, nodes: nodesUnique, recordUuidsExcluded, excludeRecordsFromCount },
    tx
  )
  console.log('===> recordsCountRows', recordsCountRows)
  if (R.isEmpty(recordsCountRows)) return {}

  const result = {}
  for (const { recordUuid, count, nodesKeyUuids } of recordsCountRows) {
    const unique = Number(count) === 1
    const validationNodesKeyFields = {}
    for (const nodeKeyUuid of nodesKeyUuids) {
      validationNodesKeyFields[nodeKeyUuid] = RecordValidation.newValidationRecordDuplicate({ unique, errorKey })
    }
    result[recordUuid] = Validation.newInstance(unique, validationNodesKeyFields)
  }
  console.log('===result', result)
  return result
}
