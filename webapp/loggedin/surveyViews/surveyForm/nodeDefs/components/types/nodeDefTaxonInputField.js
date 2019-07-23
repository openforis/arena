import React, { useRef, useState } from 'react'

import { Input } from '../../../../../../commonComponents/form/input'
import NodeDefTaxonAutocompleteDialog from './nodeDefTaxonAutocompleteDialog'

import Node from '../../../../../../../common/record/node'
import StringUtils from '../../../../../../../common/stringUtils'

const NodeDefTaxonInputField = props => {

  const {
    surveyId, taxonomyUuid, edit, draft,
    canEditRecord, readOnly,
    field, selection,
    onChangeTaxon, onChangeSelectionField,
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
  readOnly: true,

  field: Node.valuePropKeys.code,
  selection: {
    [Node.valuePropKeys.code]: '',
    [Node.valuePropKeys.scientificName]: '',
    [Node.valuePropKeys.vernacularName]: '',
  },
  onChangeTaxon: null, // function to call when the taxon value changed
  onChangeSelectionField: null, // function to call when local selection changes
}

export default NodeDefTaxonInputField
