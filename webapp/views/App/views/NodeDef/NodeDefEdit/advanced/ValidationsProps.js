import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import * as R from 'ramda'

import { useI18n } from '@webapp/store/system'

import { FormItem, Input } from '@webapp/components/form/input'
import * as InputMasks from '@webapp/components/form/inputMasks'
import Checkbox from '@webapp/components/form/checkbox'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Validation from '@core/validation/validation'

import ExpressionsProp from './ExpressionsProp'

import * as NodeDefState from '../store/state'
import { useActions } from '../store/actions'

const ValidationsProps = (props) => {
  const { nodeDefState, setNodeDefState, nodeDefParent, readOnly } = props

  const dispatch = useDispatch()
  const nodeDef = NodeDefState.getNodeDef(nodeDefState)
  const validation = NodeDefState.getValidation(nodeDefState)
  const nodeDefUuidContext = NodeDef.getUuid(nodeDefParent)
  const nodeDefValidations = NodeDef.getValidations(nodeDef)

  const { setNodeDefProp } = useActions({ nodeDefState, setNodeDefState })

  const handleValidationsUpdate = (validations) =>
    dispatch(setNodeDefProp(NodeDef.keysPropsAdvanced.validations, validations, true))

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
              onChange={(value) => handleValidationsUpdate(NodeDefValidations.assocMinCount(value)(nodeDefValidations))}
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
              onChange={(value) => handleValidationsUpdate(NodeDefValidations.assocMaxCount(value)(nodeDefValidations))}
            />
          </FormItem>
        </>
      )}
      {NodeDef.isSingle(nodeDef) && !NodeDef.isKey(nodeDef) && (
        <FormItem label={i18n.t('common.required')}>
          <Checkbox
            checked={NodeDefValidations.isRequired(nodeDefValidations)}
            disabled={readOnly}
            onChange={(checked) =>
              handleValidationsUpdate(NodeDefValidations.assocRequired(checked)(nodeDefValidations))
            }
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
            handleValidationsUpdate(NodeDefValidations.assocExpressions(expressions)(nodeDefValidations))
          }
          nodeDefUuidContext={nodeDefUuidContext}
          nodeDefUuidCurrent={NodeDef.getUuid(nodeDef)}
        />
      )}
    </div>
  )
}

ValidationsProps.propTypes = {
  nodeDefState: PropTypes.object.isRequired,
  setNodeDefState: PropTypes.func.isRequired,
  nodeDefParent: PropTypes.object,
  readOnly: PropTypes.bool,
}

ValidationsProps.defaultProps = {
  nodeDefParent: null,
  readOnly: false,
}

export default ValidationsProps
