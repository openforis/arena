import React from 'react'

import { FormItem, Input } from '../../../../commonComponents/form/input'
import Checkbox from '../../../../commonComponents/form/checkbox'

import ExpressionsProp from '../advanced/expressionsProp'

import NodeDef from '../../../../../common/survey/nodeDef'
import Validations from '../../../../../common/survey/nodeDefValidations'
import { getFieldValidation } from '../../../../../common/validation/validator'

const ValidationsProps = props => {
  const {nodeDef, readOnly, putNodeDefProp} = props

  const {validation} = nodeDef
  const validations = NodeDef.getNodeDefValidations(nodeDef)

  return (
    <div className="form">
      {
        NodeDef.isNodeDefMultiple(nodeDef)
          ? (
            <React.Fragment>
              <FormItem label="Min Count">
                <Input value={Validations.getMinCount(validations)}
                       disabled={readOnly}
                       validation={getFieldValidation('validations.count.min')(validation)}
                       onChange={value => putNodeDefProp(nodeDef, 'validations', Validations.assocMinCount(value)(validations), true)}/>
              </FormItem>
              <FormItem label="Max Count">
                <Input value={Validations.getMaxCount(validations)}
                       disabled={readOnly}
                       validation={getFieldValidation('validations.count.max')(validation)}
                       onChange={value => putNodeDefProp(nodeDef, 'validations', Validations.assocMaxCount(value)(validations), true)}/>
              </FormItem>
            </React.Fragment>
          )
          : (
            <FormItem label={'required'}>
              <Checkbox checked={Validations.isRequired(validations)}
                        disabled={readOnly}
                        onChange={(checked) => putNodeDefProp(nodeDef, 'validations', Validations.assocRequired(checked)(validations), true)}/>
            </FormItem>
          )
      }

      <ExpressionsProp nodeDef={nodeDef}
                       putNodeDefProp={putNodeDefProp}
                       label="Expressions"
                       propName="expressions"
                       readOnly={readOnly}/>
    </div>
  )
}

export default ValidationsProps