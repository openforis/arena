import React from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'
import * as CategoryItem from '@core/survey/categoryItem'

import { useI18n, useLang } from '@webapp/store/system'

import Checkbox from './Checkbox'

const NodeDefCodeCheckbox = (props) => {
  const { canEditRecord, edit, items, onItemAdd, onItemRemove, readOnly, selectedItems } = props

  const i18n = useI18n()
  const lang = useLang()

  const disabled = A.isEmpty(items)

  return (
    <div className="survey-form__node-def-code">
      {edit ? (
        <Checkbox
          disabled
          edit
          item={{
            uuid: '0',
            props: {
              labels: { [lang]: i18n.t('surveyForm.nodeDefCode.buttonCode') },
            },
          }}
        />
      ) : (
        items.map((item) => (
          <Checkbox
            key={CategoryItem.getUuid(item)}
            canEditRecord={canEditRecord}
            disabled={disabled}
            edit={edit}
            item={item}
            onItemAdd={onItemAdd}
            onItemRemove={onItemRemove}
            readOnly={readOnly}
            selectedItems={selectedItems}
          />
        ))
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
