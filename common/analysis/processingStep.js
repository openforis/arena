const R = require('ramda')

const ObjectUtils = require('@core/objectUtils')

const keys = {
  calculationSteps: 'calculationSteps',
  index: ObjectUtils.keys.index,
  processingChainUuid: 'processingChainUuid',
  props: ObjectUtils.keys.props,
  uuid: ObjectUtils.keys.uuid,
}

const keysProps = {
  entityUuid: 'entityUuid', // OR
  categoryUuid: 'categoryUuid', // OR
  virtual: 'virtual', //true|false
}

// ====== READ

const getProcessingChainUuid = R.prop(keys.processingChainUuid)
const getCalculationSteps = R.propOr([], keys.calculationSteps)
const getEntityUuid = ObjectUtils.getProp(keysProps.entityUuid)
const getCategoryUuid = ObjectUtils.getProp(keysProps.categoryUuid)
const isVirtual = ObjectUtils.getProp(keysProps.virtual, false)

// ====== UPDATE

const assocCalculation = processingStepCalculation => processingStep => R.pipe(
  getCalculationSteps,
  R.append(processingStepCalculation),
  calculationSteps => R.assoc(keys.calculationSteps, calculationSteps, processingStep)
)(processingStep)

module.exports = {
  keys,
  keysProps,

  //READ
  getProcessingChainUuid,
  getCalculationSteps,
  getCategoryUuid,
  getEntityUuid,
  getIndex: ObjectUtils.getIndex,
  getUuid: ObjectUtils.getUuid,
  isVirtual,

  //UPDATE
  mergeProps: ObjectUtils.mergeProps,
  assocCalculation,
}