import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'

import { Numbers } from '@openforis/arena-core'

import { FormItem, Input, NumberFormats } from '@webapp/components/form/Input'
import { ItemEditButtonBar } from '@webapp/components/ItemEditButtonBar'

export const ConfigurationNumericItemEditor = (props) => {
  const { labelKey, maxValue = undefined, minValue = undefined, onSave: onSaveProp, value: valueProp } = props

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
    const valueNext = Numbers.limit({ minValue, maxValue })(value)
    setState((statePrev) => ({ ...statePrev, dirty: false, editing: false, value: valueNext }))
    onSaveProp(valueNext)
  }, [maxValue, minValue, onSaveProp, value])

  const onCancel = useCallback(() => {
    setState((statePrev) => ({ ...statePrev, editing: false, value: valueProp }))
  }, [valueProp])

  return (
    <FormItem label={labelKey}>
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
