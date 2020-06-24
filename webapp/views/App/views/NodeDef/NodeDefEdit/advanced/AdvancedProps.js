import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

import * as Validation from '@core/validation/validation'
import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'

import { FormItem } from '@webapp/components/form/input'
import Checkbox from '@webapp/components/form/checkbox'

import NodeDefExpressionsProp from './ExpressionsProp/NodeDefExpressionsProp'

import * as NodeDefState from '../store/state'
import { useActions } from '../store/actions'

const AdvancedProps = (props) => {
  const { nodeDefState, setNodeDefState, nodeDefParent, readOnly } = props

  const dispatch = useDispatch()
  const i18n = useI18n()

  const nodeDef = NodeDefState.getNodeDef(nodeDefState)
  const validation = NodeDefState.getValidation(nodeDefState)
  const nodeDefUuidContext = NodeDef.getUuid(nodeDefParent)

  const { setNodeDefProp } = useActions({ nodeDefState, setNodeDefState })

  return (
    <div className="form">
      {NodeDef.canHaveDefaultValue(nodeDef) && (
        <>
          <FormItem label={i18n.t('nodeDefEdit.advancedProps.readOnly')}>
            <Checkbox
              checked={NodeDef.isReadOnly(nodeDef)}
              disabled={readOnly || NodeDef.isKey(nodeDef) || NodeDef.isMultiple(nodeDef)}
              validation={Validation.getFieldValidation(NodeDef.propKeys.readOnly)(validation)}
              onChange={(checked) => dispatch(setNodeDefProp(NodeDef.propKeys.readOnly, checked))}
            />
          </FormItem>

          <NodeDefExpressionsProp
            nodeDefState={nodeDefState}
            setNodeDefState={setNodeDefState}
            label={i18n.t('nodeDefEdit.advancedProps.defaultValues')}
            readOnly={readOnly}
            propName={NodeDef.keysPropsAdvanced.defaultValues}
            nodeDefUuidContext={nodeDefUuidContext}
            canBeConstant
            isBoolean={NodeDef.isBoolean(nodeDef)}
          />
        </>
      )}

      <NodeDefExpressionsProp
        nodeDefState={nodeDefState}
        setNodeDefState={setNodeDefState}
        label={i18n.t('nodeDefEdit.advancedProps.relevantIf')}
        readOnly={readOnly}
        propName={NodeDef.keysPropsAdvanced.applicable}
        applyIf={false}
        multiple={false}
        nodeDefUuidContext={nodeDefUuidContext}
        isContextParent
        hideAdvanced
      />
    </div>
  )
}

AdvancedProps.propTypes = {
  nodeDefState: PropTypes.object.isRequired,
  setNodeDefState: PropTypes.func.isRequired,
  nodeDefParent: PropTypes.object.isRequired,
  readOnly: PropTypes.bool,
}

AdvancedProps.defaultProps = {
  readOnly: false,
}

export default AdvancedProps
