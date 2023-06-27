import React, { useCallback, useRef, useState } from 'react'

import { Input } from '@webapp/components/form/Input'

import * as Node from '@core/record/node'
import * as StringUtils from '@core/stringUtils'
import NodeDefTaxonAutocompleteDialog from './nodeDefTaxonAutocompleteDialog'

const NodeDefTaxonInputField = (props) => {
  const {
    id,
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

  const onChangeInput = useCallback(
    (value) => {
      onChangeSelectionField(field, value)
      setAutocompleteOpened(!StringUtils.isBlank(value))
    },
    [field, onChangeSelectionField]
  )

  const onItemSelectAutocomplete = useCallback(
    (taxon) => {
      setAutocompleteOpened(false)
      onChangeTaxon(taxon)
    },
    [onChangeTaxon]
  )

  return (
    <>
      <Input
        id={id}
        ref={inputRef}
        disabled={entryDisabled}
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
    </>
  )
}

NodeDefTaxonInputField.defaultProps = {
  id: null,
  surveyId: null,
  taxonomyUuid: null,
  edit: false,
  draft: false,
  canEditRecord: false,
  readOnly: false,

  field: Node.valuePropsTaxon.code,
  selection: {
    [Node.valuePropsTaxon.code]: '',
    [Node.valuePropsTaxon.scientificName]: '',
    [Node.valuePropsTaxon.vernacularName]: '',
  },
  onChangeTaxon: null, // Function to call when the taxon value changed
  onChangeSelectionField: null, // Function to call when local selection changes
  autocompleteSourceElement: null, // Used as sourceElement for the autocompleteDialog when rendered in tableBody
}

export default NodeDefTaxonInputField
