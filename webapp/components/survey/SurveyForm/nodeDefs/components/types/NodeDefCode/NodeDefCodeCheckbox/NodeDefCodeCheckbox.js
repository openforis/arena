import React from 'react'
import PropTypes from 'prop-types'

import * as CategoryItem from '@core/survey/categoryItem'

import { useI18n, useLang } from '@webapp/store/system'

const NodeDefCodeCheckbox = (props) => {
  const { canEditRecord, edit, items, onItemAdd, onItemRemove, readOnly, selectedItems } = props

  const i18n = useI18n()
  const lang = useLang()

  const disabled = edit || !canEditRecord || readOnly

  return (
    <div className="survey-form__node-def-code">
      {edit ? (
        <button type="button" className="btn btn-s deselectable" aria-disabled disabled>
          {i18n.t('surveyForm.nodeDefCode.buttonCode')}
        </button>
      ) : (
        items.map((item) => {
          const selected = Boolean(selectedItems.find(CategoryItem.isEqual(item)))
          return (
            <button
              key={CategoryItem.getUuid(item)}
              type="button"
              className={`btn btn-s deselectable${selected ? ' active' : ''}`}
              aria-disabled={disabled}
              disabled={disabled}
              onClick={() => {
                if (selected) onItemRemove(item)
                else onItemAdd(item)
              }}
            >
              {CategoryItem.getLabel(lang)(item)}
            </button>
          )
        })
      )}
    </div>
  )
}

NodeDefCodeCheckbox.propTypes = {
  canEditRecord: PropTypes.bool,
  edit: PropTypes.bool,
  items: PropTypes.arrayOf(PropTypes.object),
  onItemAdd: PropTypes.func.isRequired,
  onItemRemove: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  selectedItems: PropTypes.arrayOf(PropTypes.object),
}

NodeDefCodeCheckbox.defaultProps = {
  canEditRecord: false,
  edit: false,
  items: [],
  readOnly: false,
  selectedItems: [],
}

export default NodeDefCodeCheckbox
