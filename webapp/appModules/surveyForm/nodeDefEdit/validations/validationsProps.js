import React from 'react'
import * as R from 'ramda'

import { FormItem, Input } from '../../../../commonComponents/form/input'
import Checkbox from '../../../../commonComponents/form/checkbox'

import ExpressionsProp from '../advanced/expressionsProp'

import NodeDef from '../../../../../common/survey/nodeDef'
import NodeDefValidations from '../../../../../common/survey/nodeDefValidations'
import Validator from '../../../../../common/validation/validator'

const ValidationsProps = props => {
  const {nodeDef, readOnly, putNodeDefProp} = props

  const {validation} = nodeDef
  const nodeDefValidations = NodeDef.getNodeDefValidations(nodeDef)

  const handleValidationsUpdate = validations =>
    putNodeDefProp(nodeDef, 'validations', validations, true)

  return (
    <div className="form">
      {
        NodeDef.isNodeDefMultiple(nodeDef)
          ? (
            <React.Fragment>
              <FormItem label="Min Count">
                <Input value={NodeDefValidations.getMinCount(nodeDefValidations)}
                       disabled={readOnly}
                       validation={Validator.getFieldValidation('validations.count.min')(validation)}
                       onChange={value => handleValidationsUpdate(
                         NodeDefValidations.assocMinCount(value)(nodeDefValidations)
                       )}/>
              </FormItem>
              <FormItem label="Max Count">
                <Input value={NodeDefValidations.getMaxCount(nodeDefValidations)}
                       disabled={readOnly}
                       validation={Validator.getFieldValidation('validations.count.max')(validation)}
                       onChange={value => handleValidationsUpdate(
                         NodeDefValidations.assocMaxCount(value)(nodeDefValidations)
                       )}/>
              </FormItem>
            </React.Fragment>
          )
          : (
            <FormItem label={'required'}>
              <Checkbox checked={NodeDefValidations.isRequired(nodeDefValidations)}
                        disabled={readOnly}
                        onChange={checked => handleValidationsUpdate(
                          NodeDefValidations.assocRequired(checked)(nodeDefValidations)
                        )}/>
            </FormItem>
          )
      }

      <ExpressionsProp label="Expressions"
                       readOnly={readOnly}
                       applyIf={true}
                       values={NodeDefValidations.getExpressions(nodeDefValidations)}
                       validation={R.pipe(
                         Validator.getFieldValidation('validations'),
                         Validator.getFieldValidation('expressions'),
                       )(validation)}
                       onChange={expressions => handleValidationsUpdate(
                         NodeDefValidations.assocExpressions(expressions)(nodeDefValidations)
                       )}/>
    </div>
  )
}

export default ValidationsProps