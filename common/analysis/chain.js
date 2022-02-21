import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'
import * as DateUtils from '@core/dateUtils'
import * as Validation from '@core/validation/validation'

export const keys = {
  dateCreated: ObjectUtils.keys.dateCreated,
  dateExecuted: 'dateExecuted',
  dateModified: ObjectUtils.keys.dateModified,
  props: ObjectUtils.keys.props,
  statusExec: 'status_exec',
  uuid: ObjectUtils.keys.uuid,
  temporary: ObjectUtils.keys.temporary,
  validation: Validation.keys.validation,
  scriptCommon: 'script_common',
}

export const keysProps = {
  labels: ObjectUtils.keysProps.labels,
  descriptions: ObjectUtils.keysProps.descriptions,
  cycles: ObjectUtils.keysProps.cycles,
  analysisNodeDefs: 'analysisNodeDefs',
  stratumNodeDefUuid: 'stratumNodeDefUuid',
  areaWeightingMethod: 'areaWeightingMethod',
  clusteringNodeDefUuid: 'clusteringNodeDefUuid',
}

export const statusExec = {
  error: 'error',
  success: 'success',
  running: 'running',
}

// ====== READ

export const {
  getUuid,
  getProps,
  getPropsDiff,
  getCycles,
  getDateCreated,
  getDateModified,
  getDescriptions,
  getDescription,
  getLabels,
  getLabel,
  isTemporary,
} = ObjectUtils
export const getDateExecuted = ObjectUtils.getDate(keys.dateExecuted)
export const getStatusExec = R.propOr(null, keys.statusExec)
export const getScriptCommon = R.propOr(null, keys.scriptCommon)
export const getStratumNodeDefUuid = ObjectUtils.getProp(keysProps.stratumNodeDefUuid)
export const isAreaWeightingMethod = ObjectUtils.isPropTrue(keysProps.areaWeightingMethod)
export const getClusteringNodeDefUuid = ObjectUtils.getProp(keysProps.clusteringNodeDefUuid)

// ====== UPDATE
export const assocStratumNodeDefUuid = (stratumNodeDefUuid) =>
  ObjectUtils.setProp(keysProps.stratumNodeDefUuid, stratumNodeDefUuid)
export const assocAreaWeightingMethod = (areaWeightingMethod) =>
  ObjectUtils.setProp(keysProps.areaWeightingMethod, areaWeightingMethod)
export const assocClusteringNodeDefUuid = (clusteringNodeDefUuid) =>
  ObjectUtils.setProp(keysProps.clusteringNodeDefUuid, clusteringNodeDefUuid)

// ====== CHECK

export const isDraft = R.ifElse(R.pipe(getDateExecuted, R.isNil), R.always(true), (chain) =>
  DateUtils.isAfter(getDateModified(chain), getDateExecuted(chain))
)

// ====== VALIDATION
// The validation object contains the validation of chain index by uuids
export const { getValidation } = Validation
export const { hasValidation } = Validation
export const { assocValidation } = Validation
export const { dissocValidation } = Validation

export const getItemValidationByUuid = (uuid) => R.pipe(getValidation, Validation.getFieldValidation(uuid))
export const assocItemValidation = (uuid, validation) => (chain) =>
  R.pipe(getValidation, Validation.assocFieldValidation(uuid, validation), (validationUpdated) =>
    Validation.assocValidation(validationUpdated)(chain)
  )(chain)
