import PropTypes from 'prop-types'

import { FormItem, Input, NumberFormats } from '@webapp/components/form/Input'

import * as NodeDef from '@core/survey/nodeDef'

import { State } from './store'

const DecimalProps = (props) => {
  const { state, Actions } = props

  const nodeDef = State.getNodeDef(state)

  const decimalDigits = NodeDef.getMaxNumberDecimalDigits(nodeDef)
  const decimalDigitsString = Number.isNaN(decimalDigits) ? '' : String(decimalDigits)

  return (
    <>
      {NodeDef.isAnalysis(nodeDef) && (
        <FormItem label="nodeDefEdit.decimalProps.unit">
          <Input
            className="node-def-unit-input"
            value={NodeDef.getUnit(nodeDef)}
            onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.unit, value })}
          />
        </FormItem>
      )}
      <FormItem label="nodeDefEdit.decimalProps.maxNumberDecimalDigits">
        <Input
          className="node-def-decimal-digits-input"
          value={decimalDigitsString}
          numberFormat={NumberFormats.integer({ allowNegative: false })}
          onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.maxNumberDecimalDigits, value })}
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
