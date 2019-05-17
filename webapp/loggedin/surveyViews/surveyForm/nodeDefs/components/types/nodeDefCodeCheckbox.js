import React from 'react'
import * as R from 'ramda'

import useI18n from '../../../../../../commonComponents/useI18n'

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
      {CategoryItem.getLabel(language)(item)}
    </button>
  )
}

const NodeDefCodeCheckbox = props => {
  const { items = [], edit, language } = props

  const i18n = useI18n()

  const disabled = R.isEmpty(items)

  return <div className="node-def__code-checkbox-wrapper">
    {
      edit
        ? <Checkbox {...props}
                    disabled={true}
                    nodes={[]}
                    item={
                      { uuid: '0', props: { labels: { [language]: i18n.t('surveyForm.nodeDefCode.buttonCode') } } }
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