import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import InputChips from '@webapp/components/form/InputChips'
import Dropdown from '@webapp/components/form/Dropdown'

import { useLang } from '@webapp/store/system'

import * as NodeDef from '@core/survey/nodeDef'
import * as CategoryItem from '@core/survey/categoryItem'

const NodeDefCodeDropdown = (props) => {
  const {
    canEditRecord,
    edit,
    entryDataQuery,
    items,
    nodeDef,
    onItemAdd,
    onItemRemove,
    readOnly,
    selectedItems,
  } = props

  const lang = useLang()

  const entryDisabled = edit || !canEditRecord || readOnly

  const disabled = R.isEmpty(items)

  return (
    <div className="survey-form__node-def-code">
      {NodeDef.isMultiple(nodeDef) && !entryDataQuery ? (
        <InputChips
          readOnly={entryDisabled}
          items={items}
          disabled={disabled}
          itemKey="uuid"
          itemLabel={CategoryItem.getLabelWithCode(lang)}
          selection={selectedItems}
          onItemAdd={onItemAdd}
          onItemRemove={onItemRemove}
        />
      ) : (
        <Dropdown
          readOnly={entryDisabled}
          items={items}
          disabled={disabled}
          itemKey="uuid"
          itemLabel={CategoryItem.getLabelWithCode(lang)}
          selection={R.head(selectedItems)}
          onChange={(item) => {
            // NB: onItemRemove is not possible?
            if (item) onItemAdd(item)
            else onItemRemove(item)
          }}
        />
      )}
    </div>
  )
}

NodeDefCodeDropdown.propTypes = {
  canEditRecord: PropTypes.bool,
  edit: PropTypes.bool,
  entryDataQuery: PropTypes.bool,
  items: PropTypes.arrayOf(PropTypes.object),
  nodeDef: PropTypes.object.isRequired,
  onItemAdd: PropTypes.func.isRequired,
  onItemRemove: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  selectedItems: PropTypes.arrayOf(PropTypes.object),
}

NodeDefCodeDropdown.defaultProps = {
  canEditRecord: false,
  edit: false,
  entryDataQuery: false,
  items: [],
  readOnly: false,
  selectedItems: [],
}

export default NodeDefCodeDropdown
