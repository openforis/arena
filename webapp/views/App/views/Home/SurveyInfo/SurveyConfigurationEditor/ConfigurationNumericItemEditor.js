import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'

import * as NumberUtils from '@core/numberUtils'
import { FormItem, Input, NumberFormats } from '@webapp/components/form/Input'
import { ItemEditButtonBar } from '@webapp/components/ItemEditButtonBar'
import { useI18n } from '@webapp/store/system'

export const ConfigurationNumericItemEditor = (props) => {
  const { labelKey, maxValue = undefined, minValue = undefined, onSave: onSaveProp, value: valueProp } = props

  const i18n = useI18n()
  const [state, setState] = useState({
    dirty: false,
    editing: false,
    value: valueProp,
  })
  const { dirty, editing, value } = state

  const onEdit = useCallback(() => setState((statePrev) => ({ ...statePrev, editing: true })), [])

  const onChange = useCallback(
    (val) => {
      const valueNext = Number(val)
      setState((statePrev) => ({ ...statePrev, dirty: Number(valueProp) !== valueNext, value: valueNext }))
    },
    [valueProp]
  )

  const onSave = useCallback(() => {
    const valueNext = NumberUtils.limit({ minValue, maxValue })(value)
    setState((statePrev) => ({ ...statePrev, dirty: false, editing: false, value: valueNext }))
    onSaveProp(valueNext)
  }, [maxValue, minValue, onSaveProp, value])

  const onCancel = useCallback(() => {
    setState((statePrev) => ({ ...statePrev, editing: false, value: valueProp }))
  }, [valueProp])

  return (
    <FormItem label={i18n.t(labelKey)}>
      <div className="display-flex">
        <Input numberFormat={NumberFormats.integer()} onChange={onChange} readOnly={!editing} value={value} />
        <ItemEditButtonBar dirty={dirty} editing={editing} onCancel={onCancel} onEdit={onEdit} onSave={onSave} />
      </div>
    </FormItem>
  )
}

ConfigurationNumericItemEditor.propTypes = {
  labelKey: PropTypes.string.isRequired,
  maxValue: PropTypes.number,
  minValue: PropTypes.number,
  onSave: PropTypes.func.isRequired,
  value: PropTypes.number.isRequired,
}
