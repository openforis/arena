import React, { useRef, useState } from 'react'

import { Input } from '../../../../../../commonComponents/form/input'
import { NodeDefTaxonAutocompleteDialog } from '../../internal'

import Node from '../../../../../../../core/record/node'
import StringUtils from '../../../../../../../core/stringUtils'

export const NodeDefTaxonInputField = props => {

  const {
    surveyId, taxonomyUuid, edit, draft,
    canEditRecord, readOnly,
    field, selection,
    onChangeTaxon, onChangeSelectionField,
    autocompleteSourceElement,
  } = props

  const entryDisabled = edit || !canEditRecord || readOnly

  const inputRef = useRef(null)
  const [autocompleteOpened, setAutocompleteOpened] = useState(false)

  const onChangeInput = value => {
    onChangeSelectionField(field, value)
    setAutocompleteOpened(!StringUtils.isBlank(value))
  }

  const onItemSelectAutocomplete = taxon => {
    setAutocompleteOpened(false)
    onChangeTaxon(taxon)
  }

  return (
    <React.Fragment>

      <Input
        ref={inputRef}
        aria-disabled={entryDisabled}
        readOnly={edit}
        value={selection[field]}
        onChange={onChangeInput}
      />

      {
        autocompleteOpened &&
        <NodeDefTaxonAutocompleteDialog
          surveyId={surveyId}
          taxonomyUuid={taxonomyUuid}
          draft={draft}

          inputRef={inputRef}
          field={field}
          fieldValue={inputRef.current.value}
          onItemSelect={onItemSelectAutocomplete}
          onClose={onItemSelectAutocomplete}
          autocompleteSourceElement={autocompleteSourceElement}
        />
      }

    </React.Fragment>
  )
}

NodeDefTaxonInputField.defaultProps = {
  surveyId: null,
  taxonomyUuid: null,
  edit: false,
  draft: false,
  canEditRecord: false,
  readOnly: false,

  field: Node.valuePropKeys.code,
  selection: {
    [Node.valuePropKeys.code]: '',
    [Node.valuePropKeys.scientificName]: '',
    [Node.valuePropKeys.vernacularName]: '',
  },
  onChangeTaxon: null, // function to call when the taxon value changed
  onChangeSelectionField: null, // function to call when local selection changes
  autocompleteSourceElement: null, // used as sourceElement for the autocompleteDialog when rendered in tableBody
}

export default NodeDefTaxonInputField
