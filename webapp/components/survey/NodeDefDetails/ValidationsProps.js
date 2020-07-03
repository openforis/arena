import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { useI18n } from '@webapp/store/system'

import { FormItem, Input } from '@webapp/components/form/input'
import * as InputMasks from '@webapp/components/form/inputMasks'
import Checkbox from '@webapp/components/form/checkbox'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Validation from '@core/validation/validation'

import { useAuthCanEditSurvey } from '@webapp/store/user'
import ExpressionsProp from './ExpressionsProp'

import { State } from './store'

const ValidationsProps = (props) => {
  const { state, Actions } = props

  const readOnly = !useAuthCanEditSurvey()

  const nodeDef = State.getNodeDef(state)
  const validation = State.getValidation(state)
  const nodeDefValidations = NodeDef.getValidations(nodeDef)
  const nodeDefUuidContext = NodeDef.getParentUuid(nodeDef)

  const onValidationsUpdate = (validations) =>
    Actions.setProp({ key: NodeDef.keysPropsAdvanced.validations, value: validations, advanced: true })

  const i18n = useI18n()

  return (
    <div className="form">
      {NodeDef.isMultiple(nodeDef) && (
        <>
          <FormItem label={i18n.t('nodeDefEdit.validationsProps.minCount')}>
            <Input
              value={NodeDefValidations.getMinCount(nodeDefValidations)}
              disabled={readOnly}
              validation={R.pipe(
                Validation.getFieldValidation(NodeDef.keysPropsAdvanced.validations),
                Validation.getFieldValidation(NodeDefValidations.keys.min)
              )(validation)}
              mask={InputMasks.integer}
              onChange={(value) => onValidationsUpdate(NodeDefValidations.assocMinCount(value)(nodeDefValidations))}
            />
          </FormItem>
          <FormItem label={i18n.t('nodeDefEdit.validationsProps.maxCount')}>
            <Input
              value={NodeDefValidations.getMaxCount(nodeDefValidations)}
              disabled={readOnly}
              validation={R.pipe(
                Validation.getFieldValidation(NodeDef.keysPropsAdvanced.validations),
                Validation.getFieldValidation(NodeDefValidations.keys.max)
              )(validation)}
              mask={InputMasks.integer}
              onChange={(value) => onValidationsUpdate(NodeDefValidations.assocMaxCount(value)(nodeDefValidations))}
            />
          </FormItem>
        </>
      )}
      {NodeDef.isSingle(nodeDef) && !NodeDef.isKey(nodeDef) && (
        <FormItem label={i18n.t('common.required')}>
          <Checkbox
            checked={NodeDefValidations.isRequired(nodeDefValidations)}
            disabled={readOnly}
            onChange={(checked) => onValidationsUpdate(NodeDefValidations.assocRequired(checked)(nodeDefValidations))}
          />
        </FormItem>
      )}
      {NodeDef.isAttribute(nodeDef) && (
        <ExpressionsProp
          label={i18n.t('nodeDefEdit.validationsProps.expressions')}
          readOnly={readOnly}
          applyIf
          hideAdvanced
          showLabels
          severity
          values={NodeDefValidations.getExpressions(nodeDefValidations)}
          validation={R.pipe(
            Validation.getFieldValidation(NodeDef.keysPropsAdvanced.validations),
            Validation.getFieldValidation(NodeDefValidations.keys.expressions)
          )(validation)}
          onChange={(expressions) =>
            onValidationsUpdate(NodeDefValidations.assocExpressions(expressions)(nodeDefValidations))
          }
          nodeDefUuidContext={nodeDefUuidContext}
          nodeDefUuidCurrent={NodeDef.getUuid(nodeDef)}
        />
      )}
    </div>
  )
}

ValidationsProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default ValidationsProps
