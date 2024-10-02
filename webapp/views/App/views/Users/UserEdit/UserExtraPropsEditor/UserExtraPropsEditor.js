import React, { useCallback, useState } from 'react'

import * as User from '@core/user/user'

import { ButtonAdd } from '@webapp/components'
import { useI18n } from '@webapp/store/system'
import { UUIDs } from '@openforis/arena-core'

import { UserExtraPropEditor } from './UserExtraPropEditor'

export const UserExtraPropsEditor = (props) => {
  const { user } = props

  const extra = User.getExtra(user)

  const i18n = useI18n()

  const [state, setState] = useState({
    editing: false,
    items: Object.entries(extra).map(([key, value]) => ({ uuid: UUIDs.v4(), name: key, value })),
  })

  const { editing, items } = state

  const onAdd = useCallback(() => {
    const newItem = { newItem: true, uuid: UUIDs.v4(), name: '', value: '' }
    setState((statePrev) => ({ ...statePrev, editing: true, items: [...statePrev.items, newItem] }))
  }, [])

  const onItemSave = useCallback(
    ({ item, index }) => {
      const itemsUpdated = [...items]
      itemsUpdated[index] = item
      setState((statePrev) => ({ ...statePrev, items: itemsUpdated }))
    },
    [items]
  )

  const onItemDelete = useCallback(
    ({ item }) => {
      const itemsUpdated = [...items]
      const itemIndex = items.indexOf((itm) => itm.uuid === item.uuid)
      itemsUpdated.splice(itemIndex, 1)
      setState((statePrev) => ({ ...statePrev, items: itemsUpdated }))
    },
    [items]
  )

  const onItemEditChange = useCallback((editingItem) => {
    setState((statePrev) => ({ ...statePrev, editing: editingItem }))
  }, [])

  return (
    <fieldset className="extra-props">
      <legend>{i18n.t('extraProp.label_plural')}</legend>

      {items.map(({ name, newItem, uuid, value }, index) => (
        <UserExtraPropEditor
          key={uuid}
          editingItems={editing}
          extraProps={items}
          index={index}
          name={name}
          newItem={newItem}
          onDelete={onItemDelete}
          onEditChange={onItemEditChange}
          onSave={onItemSave}
          uuid={uuid}
          value={value}
        />
      ))}
      <ButtonAdd disabled={editing || items.some((item) => item.newItem)} onClick={onAdd} />
    </fieldset>
  )
}
