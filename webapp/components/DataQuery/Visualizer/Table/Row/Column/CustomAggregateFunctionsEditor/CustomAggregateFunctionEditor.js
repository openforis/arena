import React, { useState } from 'react'

import * as StringUtils from '@core/stringUtils'

import { useI18n } from '@webapp/store/system'

import { FormItem, Input } from '@webapp/components/form/Input'
import { ButtonCancel, ButtonDelete, ButtonSave } from '@webapp/components'

export const CustomAggregateFunctionEditor = (props) => {
  const { fn, onCancel, onDelete, onSave } = props

  const [name, setName] = useState(fn.name)
  const [expression, setExpression] = useState(fn.expression)

  const { uuid, placeholder } = fn

  const i18n = useI18n()

  return (
    <div className="form">
      <FormItem label={i18n.t('common.name')}>
        <Input value={name} onChange={(value) => setName(StringUtils.normalizeName(value))} />
      </FormItem>
      <FormItem label={i18n.t('dataExplorerView.customAggregateFunction.sqlExpression')}>
        <textarea rows="4" value={expression} onChange={(e) => setExpression(e.target.value)} />
      </FormItem>
      <div className="button-bar">
        <ButtonSave onClick={() => onSave({ uuid, name, expression, placeholder })} />
        <ButtonCancel onClick={() => onCancel(fn)} />
        {!placeholder && <ButtonDelete onClick={() => onDelete(fn)} />}
      </div>
    </div>
  )
}
