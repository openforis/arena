import React from 'react'
import * as R from 'ramda'

import Node from '../../../../../../../common/record/node'
import CategoryItem from '../../../../../../../common/survey/categoryItem'

const Checkbox = props => {
  const { language, edit, item, nodes, selectedItems, onSelectedItemsChange, canEditRecord, readOnly } = props

  const itemUuid = CategoryItem.getUuid(item)
  const node = R.find(node => Node.getCategoryItemUuid(node) === itemUuid)(nodes)
  const selected = !!node

  return (
    <button
      className={`btn btn-of-light btn-checkbox ${selected ? 'active' : ''}`}
      aria-disabled={edit || !canEditRecord || readOnly}
      onClick={() => {
        const newSelectedItems = selected
          ? R.remove(R.indexOf(item, selectedItems), 1, selectedItems)
          : R.append(item, selectedItems)
        onSelectedItemsChange(newSelectedItems)
      }}>
      {CategoryItem.getItemLabel(language)(item)}
    </button>
  )
}

const NodeDefCodeCheckbox = props => {
  const { items = [], edit, language } = props

  const disabled = R.isEmpty(items)

  return <div className="node-def__code-checkbox-wrapper">
    {
      edit
        ? <Checkbox {...props}
                    disabled={true}
                    nodes={[]}
                    item={
                      { uuid: '0', props: { labels: { [language]: 'Button code' } } }
                    }/>
        : items.map(item =>
          <Checkbox {...props}
                    disabled={disabled}
                    key={CategoryItem.getUuid(item)}
                    item={item}/>
        )
    }
  </div>
}

export default NodeDefCodeCheckbox