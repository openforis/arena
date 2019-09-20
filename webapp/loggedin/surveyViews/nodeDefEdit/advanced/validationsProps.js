import React from 'react'
import * as R from 'ramda'

import useI18n from '../../../../commonComponents/useI18n'

import { FormItem, Input } from '../../../../commonComponents/form/input'
import Checkbox from '../../../../commonComponents/form/checkbox'

import ExpressionsProp from './expressionsProp/expressionsProp'

import NodeDef from '../../../../../common/survey/nodeDef'
import NodeDefValidations from '../../../../../common/survey/nodeDefValidations'
import Validation from '../../../../../common/validation/validation'

import createNumberMask from 'text-mask-addons/dist/createNumberMask'

const integerMask = createNumberMask({
  prefix: '',
  suffix: '',
  includeThousandsSeparator: false,
  allowNegative: false,
  allowLeadingZeroes: false,
})

const ValidationsProps = props => {
  const { nodeDef, validation, nodeDefParent, readOnly, putNodeDefProp } = props

  const nodeDefUuidContext = NodeDef.getUuid(nodeDefParent)

  const nodeDefValidations = NodeDef.getValidations(nodeDef)

  const handleValidationsUpdate = validations =>
    putNodeDefProp(nodeDef, NodeDef.propKeys.validations, validations, true)

  const i18n = useI18n()

  return (
    <div className="form">
      {
        NodeDef.isMultiple(nodeDef)
          ? (
            <React.Fragment>
              <FormItem label={i18n.t('nodeDefEdit.validationsProps.minCount')}>
                <Input value={NodeDefValidations.getMinCount(nodeDefValidations)}
                       disabled={readOnly}
                       validation={R.pipe(
                         Validation.getFieldValidation(NodeDef.propKeys.validations),
                         Validation.getFieldValidation(NodeDefValidations.keys.min),
                       )(validation)}
                       mask={integerMask}
                       onChange={value => handleValidationsUpdate(
                         NodeDefValidations.assocMinCount(value)(nodeDefValidations)
                       )}/>
              </FormItem>
              <FormItem label={i18n.t('nodeDefEdit.validationsProps.maxCount')}>
                <Input value={NodeDefValidations.getMaxCount(nodeDefValidations)}
                       disabled={readOnly}
                       validation={R.pipe(
                         Validation.getFieldValidation(NodeDef.propKeys.validations),
                         Validation.getFieldValidation(NodeDefValidations.keys.max),
                       )(validation)}
                       mask={integerMask}
                       onChange={value => handleValidationsUpdate(
                         NodeDefValidations.assocMaxCount(value)(nodeDefValidations)
                       )}/>
              </FormItem>
            </React.Fragment>
          )
          : !NodeDef.isKey(nodeDef)
          ? (
            <FormItem label={i18n.t('common.required')}>
              <Checkbox checked={NodeDefValidations.isRequired(nodeDefValidations)}
                        disabled={readOnly}
                        onChange={checked => handleValidationsUpdate(
                          NodeDefValidations.assocRequired(checked)(nodeDefValidations)
                        )}/>
            </FormItem>
          )
          : null
      }
      {
        NodeDef.isAttribute(nodeDef) &&
        <ExpressionsProp label={i18n.t('nodeDefEdit.validationsProps.expressions')}
                         readOnly={readOnly}
                         applyIf={true}
                         showLabels={true}
                         severity={true}
                         values={NodeDefValidations.getExpressions(nodeDefValidations)}
                         validation={R.pipe(
                           Validation.getFieldValidation(NodeDef.propKeys.validations),
                           Validation.getFieldValidation(NodeDefValidations.keys.expressions),
                         )(validation)}
                         onChange={expressions => handleValidationsUpdate(
                           NodeDefValidations.assocExpressions(expressions)(nodeDefValidations)
                         )}
                         nodeDefUuidContext={nodeDefUuidContext}
                         nodeDefUuidCurrent={NodeDef.getUuid(nodeDef)}/>
      }
    </div>
  )
}

export default ValidationsProps