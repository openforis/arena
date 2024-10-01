import React, { useCallback, useState } from 'react'

import * as User from '@core/user/user'
import { ButtonAdd } from '@webapp/components'
import { FormItem, Input } from '@webapp/components/form/Input'
import { useI18n } from '@webapp/store/system'

const UserExtraProp = (props) => {
  const { index, key: keyProp, value: valueProp } = props

  const i18n = useI18n()

  const [state, setState] = useState({
    key: keyProp,
    value: valueProp,
  })

  const { key, value } = state

  const onKeyChange = useCallback((val) => {
    setState((statePrev) => ({ ...statePrev, key: val }))
  }, [])

  const onValueChange = useCallback((val) => {
    setState((statePrev) => ({ ...statePrev, value: val }))
  }, [])

  return (
    <div className="extra-props display-flex">
      <FormItem label={i18n.t('extraProp.name', { position: index + 1 })}>
        <Input onChange={onKeyChange} value={key} />
      </FormItem>
      <FormItem label={i18n.t('extraProp.value')}>
        <Input onChange={onValueChange} value={value} />
      </FormItem>
    </div>
  )
}

export const UserExtraPropsEditor = (props) => {
  const { user } = props

  const extra = User.getExtra(user)

  const i18n = useI18n()

  const [state, setState] = useState({
    items: Object.entries(extra).map(([key, value]) => ({ key, value })),
  })

  const { items } = state

  const onAdd = useCallback(() => {
    setState((statePrev) => ({ ...statePrev, items: [...statePrev.items, { key: '', value: '' }] }))
  }, [])

  return (
    <fieldset className="extra-props">
      <legend>{i18n.t('extraProp.label_plural')}</legend>

      {items.map(({ key, value }, index) => (
        <UserExtraProp key={key} index={index} value={value} />
      ))}
      <ButtonAdd onClick={onAdd} />
    </fieldset>
  )
}
