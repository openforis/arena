import React, { useRef, useState } from 'react'

import { Input } from '@webapp/commonComponents/form/input'

import * as Node from '@core/record/node'
import * as StringUtils from '@core/stringUtils'
import NodeDefTaxonAutocompleteDialog from './nodeDefTaxonAutocompleteDialog'

const NodeDefTaxonInputField = props => {
  const {
    surveyId,
    taxonomyUuid,
    edit,
    draft,
    canEditRecord,
    readOnly,
    field,
    selection,
    onChangeTaxon,
    onChangeSelectionField,
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

      {autocompleteOpened && (
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
      )}
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
  onChangeTaxon: null, // Function to call when the taxon value changed
  onChangeSelectionField: null, // Function to call when local selection changes
  autocompleteSourceElement: null, // Used as sourceElement for the autocompleteDialog when rendered in tableBody
}

export default NodeDefTaxonInputField
