import React from 'react'
import axios from 'axios'

import Survey from '../../../../../../common/survey/survey'

import InputChips from '../../../../../commonComponents/form/inputChips'

const SrsEditor = props => {

  const { srs, validation, readOnly, setSrs } = props

  const srsLookupFunction = async value => {
    const { data } = await axios.get(
      '/api/geo/srs/find',
      { params: { codeOrName: value } }
    )
    return data.srss
  }

  return (
    <InputChips
      itemsLookupFunction={srsLookupFunction}
      itemKeyProp="code"
      itemLabelFunction={srs => `${srs.name} (EPSG:${srs.code})`}
      selection={srs}
      dropdownAutocompleteMinChars={3}
      requiredItems={1}
      validation={validation}
      onChange={setSrs}
      readOnly={readOnly}
    />
  )
}

export default SrsEditor