import * as R from 'ramda';
import ObjectUtils from '../../core/objectUtils';
import { IProcessingStepCalculation, IProcessingStep } from './common';

export const keys = {
  calculationSteps: 'calculationSteps',
  index: ObjectUtils.keys.index,
  processingChainUuid: 'processingChainUuid',
  props: ObjectUtils.keys.props,
  uuid: ObjectUtils.keys.uuid,
}

export const keysProps = {
  entityUuid: 'entityUuid', // OR
  categoryUuid: 'categoryUuid', // OR
  virtual: 'virtual', //true|false
}

// ====== READ

export const getCalculationSteps: (obj: IProcessingStep) => IProcessingStepCalculation[] = R.propOr([], keys.calculationSteps)
export const getEntityUuid = ObjectUtils.getProp(keysProps.entityUuid)
export const getCategoryUuid = ObjectUtils.getProp(keysProps.categoryUuid)
export const isVirtual = ObjectUtils.getProp(keysProps.virtual, false)

// ====== UPDATE

export const assocCalculation = processingStepCalculation => processingStep => R.pipe(
  getCalculationSteps,
  R.append(processingStepCalculation),
  calculationSteps => R.assoc(keys.calculationSteps, calculationSteps, processingStep)
)(processingStep)

export const getIndex = ObjectUtils.getIndex
export const getUuid = ObjectUtils.getUuid

export default {
  keys,
  keysProps,

  //READ
  getCalculationSteps,
  getCategoryUuid,
  getEntityUuid,
  getIndex,
  getUuid,
  isVirtual,

  //UPDATE
  assocCalculation,
};
