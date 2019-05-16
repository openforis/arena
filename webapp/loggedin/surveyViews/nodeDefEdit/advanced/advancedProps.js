import React, { useContext } from 'react'

import AppContext from '../../../../app/appContext'

import { NodeDefExpressionsProp } from './expressionsProp'

import Validator from '../../../../../common/validation/validator'
import NodeDef from '../../../../../common/survey/nodeDef'
import { FormItem } from '../../../../commonComponents/form/input'
import Checkbox from '../../../../commonComponents/form/checkbox'

const AdvancedProps = props => {
  const { nodeDef, nodeDefParent, putNodeDefProp, readOnly } = props

  const validation = NodeDef.getValidation(nodeDef)
  const nodeDefUuidContext = NodeDef.getUuid(nodeDefParent)

  const { i18n } = useContext(AppContext)

  return (
    <div className="form">
      {
        NodeDef.canNodeDefHaveDefaultValue(nodeDef) &&
        <React.Fragment>

          <FormItem label={i18n.t('nodeDefEdit.advancedProps.readOnly')}>
            <Checkbox checked={NodeDef.isReadOnly(nodeDef)}
                      disabled={readOnly || NodeDef.isKey(nodeDef) || NodeDef.isMultiple(nodeDef)}
                      validation={Validator.getFieldValidation(NodeDef.propKeys.readOnly)(validation)}
                      onChange={checked => putNodeDefProp(nodeDef, NodeDef.propKeys.readOnly, checked)}/>
          </FormItem>

          <NodeDefExpressionsProp nodeDef={nodeDef}
                                  putNodeDefProp={putNodeDefProp}
                                  label={i18n.t('nodeDefEdit.advancedProps.defaultValues')}
                                  readOnly={readOnly}
                                  propName="defaultValues"
                                  validation={Validator.getFieldValidation('defaultValues')(validation)}
                                  nodeDefUuidContext={nodeDefUuidContext}
                                  canBeConstant={true}
                                  isBoolean={NodeDef.isBoolean(nodeDef)}/>
        </React.Fragment>
      }

      <NodeDefExpressionsProp nodeDef={nodeDef}
                              putNodeDefProp={putNodeDefProp}
                              label={i18n.t('nodeDefEdit.advancedProps.applicableIf')}
                              readOnly={readOnly}
                              propName="applicable"
                              applyIf={false}
                              multiple={false}
                              validation={Validator.getFieldValidation('applicable')(validation)}
                              nodeDefUuidContext={nodeDefUuidContext}
                              isContextParent={true}/>


    </div>
  )
}

export default AdvancedProps