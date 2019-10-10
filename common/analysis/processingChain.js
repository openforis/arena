const R = require('ramda')

const ObjectUtils = require('../objectUtils')
const DateUtils = require('../dateUtils')

const keys = {
  dateCreated: ObjectUtils.keys.dateCreated,
  dateExecuted: 'dateExecuted',
  dateModified: ObjectUtils.keys.dateModified,
  processingSteps: 'processingSteps',
  statusExec: 'statusExec',
  uuid: ObjectUtils.keys.uuid,
}

const keysProps = {
  labels: ObjectUtils.keysProps.labels,
  descriptions: ObjectUtils.keysProps.descriptions,
}

const statusExec = {
  error: 'error',
  success: 'success',
  running: 'running',
}

// ====== READ

const getDateCreated = ObjectUtils.getDateCreated
const getDateExecuted = ObjectUtils.getDate(keys.dateExecuted)
const getDateModified = ObjectUtils.getDateModified
const getProcessingSteps = R.propOr([], keys.processingSteps)
const getStatusExec = R.propOr(null, keys.statusExec)

// ====== CHECK

const isDraft = R.ifElse(
  R.pipe(getDateExecuted, R.isNil),
  R.always(true),
  chain => DateUtils.isAfter(getDateModified(chain), getDateExecuted(chain))
)

// ====== UPDATE

const assocProcessingSteps = R.assoc(keys.processingSteps)

module.exports = {
  statusExec,
  keysProps,

  //READ
  getDateCreated,
  getDateExecuted,
  getDateModified,
  getDescriptions: ObjectUtils.getDescriptions,
  getDescription: ObjectUtils.getDescription,
  getLabels: ObjectUtils.getLabels,
  getLabel: ObjectUtils.getLabel,
  getProcessingSteps,
  getStatusExec,
  getUuid: ObjectUtils.getUuid,

  //CHECK
  isDraft,

  //UPDATE
  assocProp: ObjectUtils.setProp,
  assocProcessingSteps,
}