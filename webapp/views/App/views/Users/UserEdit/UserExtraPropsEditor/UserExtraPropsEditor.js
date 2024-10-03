import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'

import { UUIDs } from '@openforis/arena-core'

import * as User from '@core/user/user'

import { ButtonAdd, ExpansionPanel } from '@webapp/components'

import { UserExtraPropEditor } from './UserExtraPropEditor'

const extraEntryToItem = ([name, value]) => ({ uuid: UUIDs.v4(), name, value })
const extraToItems = (extra) => Object.entries(extra).map(extraEntryToItem)

const itemsToExtraProps = (items) =>
  items.reduce((acc, item) => {
    acc[item.name] = item.value
    return acc
  }, {})

export const UserExtraPropsEditor = (props) => {
  const { onChange, user } = props

  const extra = User.getExtra(user)

  const [state, setState] = useState({
    editing: false,
    items: extraToItems(extra),
  })

  const { editing, items } = state

  const onAdd = useCallback(() => {
    const newItem = { newItem: true, uuid: UUIDs.v4(), name: '', value: '' }
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
      const itemIndex = items.indexOf((itm) => itm.uuid === item.uuid)
      itemsUpdated.splice(itemIndex, 1)
      onItemsUpdate(itemsUpdated)
    },
    [items, onItemsUpdate]
  )

  const onItemEditChange = useCallback((editingItem) => {
    setState((statePrev) => ({ ...statePrev, editing: editingItem }))
  }, [])

  return (
    <ExpansionPanel buttonLabel="extraProp.label_plural" className="extra-props" startClosed={items.length === 0}>
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
          uuid={uuid}
          value={value}
        />
      ))}
      <ButtonAdd
        className="btn-add"
        disabled={editing || items.some((item) => item.newItem)}
        label="extraProp.addExtraProp"
        onClick={onAdd}
      />
    </ExpansionPanel>
  )
}

UserExtraPropsEditor.propTypes = {
  onChange: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired,
}
