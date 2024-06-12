import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'

import * as NodeDefExpressionsValidator from './nodeDefExpressionsValidator'
import { NodeDefCountType } from '@openforis/arena-core/dist/nodeDef'

const getMultipleNodeDefPropValidations = ({ survey, nodeDef }) =>
  Object.keys(NodeDefCountType).reduce((acc, countType) => {
    const propKey = `${NodeDefValidations.keys.count}.${countType}`
    acc[propKey] = [
      () =>
        NodeDefExpressionsValidator.validateSingleExpressionInternal({
          survey,
          nodeDef,
          dependencyType:
            countType === NodeDefCountType.min ? Survey.dependencyTypes.minCount : Survey.dependencyTypes.maxCount,
        }),
    ]
    return acc
  }, {})

export const validate = async (survey, nodeDef) => {
  const nodeDefValidations = NodeDef.getValidations(nodeDef)
  const validation = NodeDef.isMultiple(nodeDef)
    ? await Validator.validate(nodeDefValidations, getMultipleNodeDefPropValidations({ survey, nodeDef }))
    : Validation.newInstance()

  const expressionsValidation = await NodeDefExpressionsValidator.validate(
    survey,
    nodeDef,
    Survey.dependencyTypes.validations
  )

  return R.pipe(
    Validation.assocFieldValidation(NodeDefValidations.keys.expressions, expressionsValidation),
    R.unless(Validation.isValid, Validation.setErrors([{ key: Validation.messageKeys.nodeDefEdit.validationsInvalid }]))
  )(validation)
}
