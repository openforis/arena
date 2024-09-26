import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import { FormItem, Input, NumberFormats } from '@webapp/components/form/Input'

import * as NodeDef from '@core/survey/nodeDef'

import { State } from './store'

const DecimalProps = (props) => {
  const { state, Actions } = props

  const i18n = useI18n()

  const nodeDef = State.getNodeDef(state)

  const decimalDigits = NodeDef.getMaxNumberDecimalDigits(nodeDef)
  const decimalDigitsString = Number.isNaN(decimalDigits) ? '' : String(decimalDigits)

  return (
    <FormItem label={i18n.t('nodeDefEdit.decimalProps.maxNumberDecimalDigits')}>
      <Input
        value={decimalDigitsString}
        numberFormat={NumberFormats.integer({ allowNegative: false })}
        onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.maxNumberDecimalDigits, value })}
      />
    </FormItem>
  )
}

DecimalProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default DecimalProps
