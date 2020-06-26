import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

import * as Validation from '@core/validation/validation'
import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'

import { FormItem } from '@webapp/components/form/input'
import Checkbox from '@webapp/components/form/checkbox'

import { useNodeDefParentByUuid } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import NodeDefExpressionsProp from './ExpressionsProp/NodeDefExpressionsProp'
import { NodeDefState, useActions } from './store'

const AdvancedProps = (props) => {
  const { nodeDefState, setNodeDefState } = props

  const dispatch = useDispatch()
  const readOnly = !useAuthCanEditSurvey()
  const Actions = useActions({ nodeDefState, setNodeDefState })

  const nodeDef = NodeDefState.getNodeDef(nodeDefState)
  const validation = NodeDefState.getValidation(nodeDefState)

  const nodeDefParent = useNodeDefParentByUuid(NodeDef.getUuid(nodeDef))
  const nodeDefUuidContext = NodeDef.getUuid(nodeDefParent)

  const i18n = useI18n()

  return (
    <div className="form">
      {NodeDef.canHaveDefaultValue(nodeDef) && (
        <>
          <FormItem label={i18n.t('nodeDefEdit.advancedProps.readOnly')}>
            <Checkbox
              checked={NodeDef.isReadOnly(nodeDef)}
              disabled={readOnly || NodeDef.isKey(nodeDef) || NodeDef.isMultiple(nodeDef)}
              validation={Validation.getFieldValidation(NodeDef.propKeys.readOnly)(validation)}
              onChange={(checked) => dispatch(Actions.setNodeDefProp(NodeDef.propKeys.readOnly, checked))}
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
}

export default AdvancedProps
