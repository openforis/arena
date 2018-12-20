import React from 'react'
import * as R from 'ramda'

import Node from '../../../../../../common/record/node'
import Category from '../../../../../../common/survey/category'

const Checkbox = props => {
  const {language, edit, item, nodes, selectedItems, onSelectedItemsChange} = props

  const itemUuid = item.uuid
  const node = R.find(node => Node.getCategoryItemUuid(node) === itemUuid)(nodes)
  const selected = !!node

  return (
    <button
      className={`btn btn-of-light ${selected ? 'active' : ''}`}
      style={{
        pointerEvents: 'all',
      }}
      aria-disabled={edit}
      onClick={() => {
        const newSelectedItems = selected
          ? R.remove(R.indexOf(item, selectedItems), 1, selectedItems)
          : R.append(item, selectedItems)
        onSelectedItemsChange(newSelectedItems)
      }}>
      {Category.getItemLabel(language)(item)}
    </button>
  )
}

const NodeDefCodeCheckbox = props => {
  const {items = []} = props

  const disabled = R.isEmpty(items)

  return <div className="node-def__code-checkbox-wrapper">
    {
      items.map(item =>
        <Checkbox {...props}
                  disabled={disabled}
                  key={item.uuid}
                  item={item}/>
      )
    }
  </div>
}

export default NodeDefCodeCheckbox