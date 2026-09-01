import PropTypes from 'prop-types'

import { FormItem, Input, NumberFormats } from '@webapp/components/form/Input'

import * as NodeDef from '@core/survey/nodeDef'

import { State, useNodeDefEditReadOnly } from './store'
import NodeDefUnitFormItem from './NodeDefUnitFormItem'

const DecimalProps = (props) => {
  const { state, Actions } = props

  const readOnly = useNodeDefEditReadOnly()
  const nodeDef = State.getNodeDef(state)

  const decimalDigits = NodeDef.getMaxNumberDecimalDigits(nodeDef)
  const decimalDigitsString = Number.isNaN(decimalDigits) ? '' : String(decimalDigits)

  return (
    <>
      <NodeDefUnitFormItem state={state} Actions={Actions} />
      <FormItem label="nodeDefEdit.decimalProps.maxNumberDecimalDigits">
        <Input
          className="node-def-decimal-digits-input"
          value={decimalDigitsString}
          numberFormat={NumberFormats.integer({ allowNegative: false })}
          onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.maxNumberDecimalDigits, value })}
          readOnly={readOnly}
        />
      </FormItem>
    </>
  )
}

DecimalProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default DecimalProps
