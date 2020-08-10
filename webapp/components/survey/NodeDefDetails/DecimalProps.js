import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import { FormItem, Input } from '@webapp/components/form/input'

import * as NodeDef from '@core/survey/nodeDef'

import { State } from './store'

const DecimalProps = (props) => {
  const { state, Actions } = props

  const i18n = useI18n()

  const nodeDef = State.getNodeDef(state)

  return (
    <FormItem label={i18n.t('nodeDefEdit.decimalProps.maxNumberDecimalDigits')}>
      <Input
        disabled={false}
        placeholder={i18n.t('nodeDefEdit.decimalProps.maxNumberDecimalDigits')}
        value={NodeDef.getProp(NodeDef.propKeys.maxNumberDecimalDigits)(nodeDef) || ''}
        type="number"
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
