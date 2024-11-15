import {
  RecordValidator,
  RecordUpdateResult,
  RecordNodesUpdater as CoreRecordNodesUpdater,
} from '@openforis/arena-core'

import * as A from '@core/arena'
import * as Validation from '@core/validation/validation'

const { updateNodesDependents } = CoreRecordNodesUpdater

export const afterNodesUpdate = async ({ user, survey, record, nodes, timezoneOffset, sideEffect = false }) => {
  // output
  const updateResult = new RecordUpdateResult({ record, nodes })

  // 1. update dependent nodes
  const updateResultDependents = updateNodesDependents({
    user,
    survey,
    record,
    nodes,
    timezoneOffset,
    sideEffect,
  })

  updateResult.merge(updateResultDependents)

  // 2. update node validations
  const nodesValidation = await RecordValidator.validateNodes({
    survey,
    record: updateResult.record,
    nodes: updateResult.nodes,
  })
  const recordValidationUpdated = A.pipe(
    Validation.getValidation,
    Validation.mergeValidation(nodesValidation),
    Validation.updateCounts
  )(updateResult.record)
  updateResult.record = Validation.assocValidation(recordValidationUpdated)(updateResult.record)

  return updateResult
}
