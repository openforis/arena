import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { Objects } from '@openforis/arena-core'

import * as NodeDef from '@core/survey/nodeDef'

import { TestId } from '@webapp/utils/testId'
import { useI18n } from '@webapp/store/system'
import InputChips from '@webapp/components/form/InputChips'
import Dropdown from '@webapp/components/form/Dropdown'

const NodeDefCodeDropdown = (props) => {
  const {
    autocomplete,
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

  const i18n = useI18n()

  const entryDisabled = edit || !canEditRecord || readOnly

  const disabled = R.isEmpty(items)
  const minCharactersToAutocomplete = autocomplete ? 1 : 0

  return (
    <div className="survey-form__node-def-code">
      {NodeDef.isMultiple(nodeDef) && !edit && !entryDataQuery ? (
        <InputChips
          readOnly={entryDisabled}
          items={items}
          disabled={disabled}
          itemKey="uuid"
          itemLabel={itemLabelFunction}
          minCharactersToAutocomplete={minCharactersToAutocomplete}
          selection={selectedItems}
          onItemAdd={onItemAdd}
          onItemRemove={onItemRemove}
        />
      ) : (
        <Dropdown
          disabled={disabled}
          itemValue="uuid"
          itemLabel={itemLabelFunction}
          items={items}
          minCharactersToAutocomplete={minCharactersToAutocomplete}
          onChange={(item) => {
            // NB: onItemRemove is not possible?
            if (item) onItemAdd(item)
            else onItemRemove(item)
          }}
          placeholder={autocomplete ? i18n.t('surveyForm.nodeDefCode.typeCodeOrLabel') : undefined}
          readOnly={entryDisabled}
          selection={Objects.isEmpty(selectedItems) ? null : R.head(selectedItems)}
          testId={TestId.surveyForm.codeInputDropdown(NodeDef.getName(nodeDef))}
        />
      )}
    </div>
  )
}

NodeDefCodeDropdown.propTypes = {
  autocomplete: PropTypes.bool,
  canEditRecord: PropTypes.bool,
  edit: PropTypes.bool,
  entryDataQuery: PropTypes.bool,
  itemLabelFunction: PropTypes.func.isRequired,
  items: PropTypes.oneOfType([PropTypes.array, PropTypes.func]).isRequired,
  nodeDef: PropTypes.object.isRequired,
  onItemAdd: PropTypes.func.isRequired,
  onItemRemove: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  selectedItems: PropTypes.arrayOf(PropTypes.object),
}

NodeDefCodeDropdown.defaultProps = {
  autocomplete: false,
  canEditRecord: false,
  edit: false,
  entryDataQuery: false,
  items: [],
  readOnly: false,
  selectedItems: [],
}

export default NodeDefCodeDropdown
