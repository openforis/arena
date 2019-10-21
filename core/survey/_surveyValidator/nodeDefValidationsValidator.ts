import * as R from 'ramda';
import NodeDefValidations from '../nodeDefValidations';
import NodeDef from '../nodeDef';
import Validator from '../../validation/validator';
import Validation from '../../validation/validation';
import NodeDefExpressionsValidator from './nodeDefExpressionsValidator';

const validate = async (survey, nodeDef, nodeDefValidations, errorKey = null) => {
  const validation = NodeDef.isMultiple(nodeDef)
    ? await Validator.validate(nodeDefValidations, {
      [`${NodeDefValidations.keys.count}.${NodeDefValidations.keys.min}`]:
        [Validator.validatePositiveNumber(Validation.messageKeys.nodeDefEdit.countMinMustBePositiveNumber)],
      [`${NodeDefValidations.keys.count}.${NodeDefValidations.keys.max}`]:
        [Validator.validatePositiveNumber(Validation.messageKeys.nodeDefEdit.countMaxMustBePositiveNumber)],
    })
    : {}

  return R.pipe(
    Validation.assocFieldValidation(
      NodeDefValidations.keys.expressions,
      await NodeDefExpressionsValidator.validate(survey, nodeDef, NodeDefValidations.getExpressions(nodeDefValidations), false)
    ),
    R.when(
      validation => errorKey && !Validation.isValid(validation) && !Validation.hasErrors(validation),
      Validation.setErrors([{ key: errorKey }])
    )
  )(validation)
}

export default {
  validate
};
