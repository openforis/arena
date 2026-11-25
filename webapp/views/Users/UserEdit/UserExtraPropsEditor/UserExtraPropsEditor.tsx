import { useCallback, useState } from 'react'

import { UUIDs, type ArenaUser } from '@openforis/arena-core'

import * as User from '@core/user/user'

import { ButtonAdd, ExpansionPanel } from '@webapp/components'

import { UserExtraPropEditor, type UserExtraPropItem } from './UserExtraPropEditor'

const extraEntryToItem = ([name, value]: [string, string]): UserExtraPropItem => ({ uuid: UUIDs.v4(), name, value })
const extraToItems = (extra) => Object.entries(extra).map(extraEntryToItem)

const itemsToExtraProps = (items: UserExtraPropItem[]): Record<string, string> =>
  items.reduce((acc, item) => {
    acc[item.name] = item.value
    return acc
  }, {})

type UserExtraPropsEditorProps = {
  onChange: (...args: any[]) => any
  readOnly?: boolean
  user: ArenaUser
}

export const UserExtraPropsEditor = (props: UserExtraPropsEditorProps) => {
  const { onChange, readOnly = false, user } = props

  const extra = User.getExtra(user)

  const [state, setState] = useState<{ editing: boolean; items: UserExtraPropItem[] }>({
    editing: false,
    items: extraToItems(extra),
  })

  const { editing, items } = state

  const onAdd = useCallback(() => {
    const newItem: UserExtraPropItem = { newItem: true, uuid: UUIDs.v4(), name: '', value: '' }
    setState((statePrev) => ({ ...statePrev, editing: true, items: [...statePrev.items, newItem] }))
  }, [])

  const onItemsUpdate = useCallback(
    (itemsUpdated) => {
      setState((statePrev) => ({ ...statePrev, items: itemsUpdated }))
      onChange(itemsToExtraProps(itemsUpdated))
    },
    [onChange]
  )

  const onItemSave = useCallback(
    ({ item, index }) => {
      const itemsUpdated = [...items]
      itemsUpdated[index] = item
      onItemsUpdate(itemsUpdated)
    },
    [items, onItemsUpdate]
  )

  const onItemDelete = useCallback(
    ({ item }) => {
      const itemsUpdated = [...items]
      const itemIndex = items.findIndex((itm) => itm.uuid === item.uuid)
      itemsUpdated.splice(itemIndex, 1)
      onItemsUpdate(itemsUpdated)
    },
    [items, onItemsUpdate]
  )

  const onItemEditChange = useCallback((editingItem) => {
    setState((statePrev) => ({ ...statePrev, editing: editingItem }))
  }, [])

  if (readOnly && items.length === 0) return null

  return (
    <ExpansionPanel buttonLabel="extraProp.label_other" className="extra-props" startClosed={items.length === 0}>
      <div className="form">
        {items.map(({ name, newItem, uuid, value }, index) => (
          <UserExtraPropEditor
            key={uuid}
            editingItems={editing}
            index={index}
            items={items}
            name={name}
            newItem={newItem}
            onDelete={onItemDelete}
            onEditChange={onItemEditChange}
            onSave={onItemSave}
            readOnly={readOnly}
            uuid={uuid}
            value={value}
          />
        ))}
        {!readOnly && (
          <ButtonAdd
            className="btn-add"
            disabled={editing || items.some((item) => item.newItem)}
            label="extraProp.addExtraProp"
            onClick={onAdd}
          />
        )}
      </div>
    </ExpansionPanel>
  )
}
