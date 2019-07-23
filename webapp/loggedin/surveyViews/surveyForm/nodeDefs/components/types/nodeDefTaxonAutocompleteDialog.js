import React, { useState, useEffect } from 'react'
import * as R from 'ramda'
import axios from 'axios'

import AutocompleteDialog from '../../../../../../commonComponents/form/autocompleteDialog'
import { useIsMounted } from '../../../../../../commonComponents/hooks'

import Taxon from '../../../../../../../common/survey/taxon'
import Node from '../../../../../../../common/record/node'
import ReactDOM from 'react-dom'

const loadTaxa = async (surveyId, taxonomyUuid, draft, field, value) => {
  const searchValue = field === Node.valuePropKeys.code
    ? `${value}*` //starts with value
    : `*${value}*` //contains value

  const params = {
    filterProp: field,
    filterValue: searchValue,
    includeUnlUnk: true,
    draft,
  }
  const { data: { taxa } } = await axios.get(
    `/api/survey/${surveyId}/taxonomies/${taxonomyUuid}/taxa`,
    { params }
  )
  return taxa
}

const NodeDefTaxonAutocompleteItemRenderer = props => {
  const { item: taxon, ...otherProps } = props

  const vernacularNames = Taxon.getVernacularNames(taxon)
  const vernacularNamesString = R.pipe(
    R.keys, //vernacular language codes
    R.map(langCode => `${R.prop(langCode, vernacularNames)} (${langCode})`),
    R.join(', ')
  )(vernacularNames)

  return (
    <div {...otherProps}
         key={Taxon.getUuid(taxon)}
         className="item"
         tabIndex="1">
      <div>
        {Taxon.getCode(taxon)}
      </div>
      <div>
        {Taxon.getScientificName(taxon)}
      </div>
      <div style={{ gridColumn: 2 }}>
        {vernacularNamesString}
      </div>
    </div>
  )
}

const NodeDefTaxonAutocompleteDialog = props => {
  const {
    surveyId, taxonomyUuid, draft,
    inputRef, field, fieldValue,
    onItemSelect, onClose,
  } = props

  const isMounted = useIsMounted()
  const [items, setItems] = useState([])

  useEffect(() => {
    (async () => {
      const itemsUpdate = await loadTaxa(surveyId, taxonomyUuid, draft, field, fieldValue)

      if (isMounted.current)
        setItems(itemsUpdate)
    })()
  }, [fieldValue])

  return ReactDOM.createPortal(
    <AutocompleteDialog
      className="survey-form__node-def-taxon-autocomplete-list"
      items={items}
      itemRenderer={NodeDefTaxonAutocompleteItemRenderer}
      itemKeyFunction={taxon => `${Taxon.getUuid(taxon)}_${taxon.vernacularName}`}
      inputField={inputRef.current}
      onItemSelect={onItemSelect}
      onClose={onClose}
    />
    ,
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
}

export default NodeDefTaxonAutocompleteDialog
