import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'
import { TestId } from '@webapp/utils/testId'

import InputChips from '@webapp/components/form/InputChips'
import Dropdown from '@webapp/components/form/Dropdown'

const NodeDefCodeDropdown = (props) => {
  const {
    canEditRecord,
    edit,
    entryDataQuery,
    itemLabelFunction,
    items,
    nodeDef,
    onItemAdd,
    onItemRemove,
    readOnly,
    selectedItems,
  } = props

  const entryDisabled = edit || !canEditRecord || readOnly

  const disabled = R.isEmpty(items)

  return (
    <div className="survey-form__node-def-code">
      {NodeDef.isMultiple(nodeDef) && !edit && !entryDataQuery ? (
        <InputChips
          readOnly={entryDisabled}
          items={items}
          disabled={disabled}
          itemKey="uuid"
          itemLabel={itemLabelFunction}
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
          itemLabel={itemLabelFunction}
          selection={R.head(selectedItems)}
          onChange={(item) => {
            // NB: onItemRemove is not possible?
            if (item) onItemAdd(item)
            else onItemRemove(item)
          }}
          testId={TestId.surveyForm.codeInputDropdown(NodeDef.getName(nodeDef))}
        />
      )}
    </div>
  )
}

NodeDefCodeDropdown.propTypes = {
  canEditRecord: PropTypes.bool,
  edit: PropTypes.bool,
  entryDataQuery: PropTypes.bool,
  itemLabelFunction: PropTypes.func.isRequired,
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
