import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'

import AutocompleteDialog from '@webapp/components/form/AutocompleteDialog'
import { useAsyncGetRequest } from '@webapp/components/hooks'

import * as Taxon from '@core/survey/taxon'

const NodeDefTaxonAutocompleteItemRenderer = (props) => {
  const { item: taxon, itemLabel, ...otherProps } = props

  const vernacularLang = Taxon.getVernacularLanguage(taxon)

  return (
    <div {...otherProps} key={Taxon.getUuid(taxon)} className="item" tabIndex="1">
      <div>{itemLabel(taxon)}</div>
      {vernacularLang && <div style={{ gridColumn: 2 }}>{`${Taxon.getVernacularName(taxon)} (${vernacularLang})`}</div>}
    </div>
  )
}

const NodeDefTaxonAutocompleteDialog = (props) => {
  const {
    surveyId,
    taxonomyUuid,
    draft,
    inputRef,
    field,
    fieldValue,
    autocompleteSourceElement,
    onItemSelect,
    onClose,
  } = props

  const params = {
    filterProp: field,
    filterValue: fieldValue,
    includeUnlUnk: true,
    draft,
  }

  const {
    data: { list = [] } = { list: [] },
    dispatch,
  } = useAsyncGetRequest(`/api/survey/${surveyId}/taxonomies/${taxonomyUuid}/taxa`, { params })

  useEffect(dispatch, [fieldValue])

  return ReactDOM.createPortal(
    <AutocompleteDialog
      className="survey-form__node-def-taxon-autocomplete-list"
      items={list}
      itemRenderer={NodeDefTaxonAutocompleteItemRenderer}
      itemKey={(taxon) => `${Taxon.getUuid(taxon)}_${taxon.vernacularName}`}
      itemLabel={(taxon) => `${Taxon.getCode(taxon)}-${Taxon.getScientificName(taxon)}`}
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
  itemLabel: PropTypes.func.isRequired,
}

export default NodeDefTaxonAutocompleteDialog
