import React from 'react'
import * as R from 'ramda'

import { useI18n } from '@webapp/commonComponents/hooks'

import CategoryItem from '@core/survey/categoryItem'

const Checkbox = props => {
  const {
    lang,
    item, selectedItems,
    edit, canEditRecord, readOnly,
    onItemAdd, onItemRemove
  } = props

  const selected = !!selectedItems.find(CategoryItem.isEqual(item))

  return (
    <button
      className={`btn btn-s deselectable${selected ? ' active' : ''}`}
      aria-disabled={edit || !canEditRecord || readOnly}
      onClick={() => {
        selected
          ? onItemRemove(item)
          : onItemAdd(item)
      }}>
      {CategoryItem.getLabel(lang)(item)}
    </button>
  )
}

const NodeDefCodeCheckbox = props => {
  const { items = [], edit, lang } = props

  const i18n = useI18n()

  const disabled = R.isEmpty(items)

  return (
    <div className="survey-form__node-def-code">
      {
        edit
          ? (
            <Checkbox
              {...props}
              disabled={true}
              nodes={[]}
              item={
                { uuid: '0', props: { labels: { [lang]: i18n.t('surveyForm.nodeDefCode.buttonCode') } } }
              }
            />
          )
          : items.map(item =>
            (
              <Checkbox
                {...props}
                disabled={disabled}
                key={CategoryItem.getUuid(item)}
                item={item}
              />
            )
          )
      }
    </div>
  )
}

export default NodeDefCodeCheckbox
