import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'

import AutocompleteDialog from '@webapp/components/form/AutocompleteDialog'

import * as Taxon from '@core/survey/taxon'
import { useTaxa } from './useTaxa'

const NodeDefTaxonAutocompleteItemRenderer = (props) => {
  const { item: taxon, onKeyDown, onMouseDown } = props

  const vernacularLang = Taxon.getVernacularLanguage(taxon)

  return (
    <div
      key={Taxon.getUuid(taxon)}
      className="item"
      onKeyDown={onKeyDown}
      onMouseDown={onMouseDown}
      role="button"
      tabIndex="1"
    >
      <div>{Taxon.getCode(taxon)}</div>
      <div>{Taxon.getScientificName(taxon)}</div>
      {vernacularLang && <div style={{ gridColumn: 2 }}>{`${Taxon.getVernacularName(taxon)} (${vernacularLang})`}</div>}
    </div>
  )
}

const NodeDefTaxonAutocompleteDialog = (props) => {
  const {
    nodeDef,
    parentNode,
    draft,
    entryDataQuery,
    inputRef,
    field,
    fieldValue,
    autocompleteSourceElement,
    onItemSelect,
    onClose,
  } = props

  const taxa = useTaxa({ nodeDef, parentNode, draft, entryDataQuery, field, fieldValue })

  return ReactDOM.createPortal(
    <AutocompleteDialog
      className="survey-form__node-def-taxon-autocomplete-list"
      items={taxa}
      itemRenderer={NodeDefTaxonAutocompleteItemRenderer}
      itemKey={(taxon) => `${Taxon.getUuid(taxon)}_${Taxon.getVernacularNameUuid(taxon)}`}
      inputField={inputRef.current}
      onItemSelect={onItemSelect}
      onClose={onClose}
      sourceElement={autocompleteSourceElement}
    />,
    document.body
  )
}

NodeDefTaxonAutocompleteDialog.defaultProps = {
  surveyId: null,
  taxonomyUuid: null,
  draft: false,

  inputRef: null,
  field: '',
  fieldValue: '',
  onItemSelect: null,
  onClose: null,
  autocompleteSourceElement: null, // Used as sourceElement for the autocompleteDialog when rendered in tableBody
}

NodeDefTaxonAutocompleteItemRenderer.propTypes = {
  item: PropTypes.object.isRequired,
  onKeyDown: PropTypes.func,
  onMouseDown: PropTypes.func,
}

export default NodeDefTaxonAutocompleteDialog
