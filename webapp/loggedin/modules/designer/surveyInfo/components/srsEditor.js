import React from 'react'
import axios from 'axios'

import InputChips from '@webapp/commonComponents/form/inputChips'

import * as Srs from '@core/geo/srs'

const SrsEditor = props => {
  const { srs, validation, readOnly, setSrs } = props

  const srsLookupFunction = async value => {
    const { data } = await axios.get('/api/geo/srs/find', {
      params: { codeOrName: value },
    })
    return data.srss
  }

  return (
    <InputChips
      itemsLookupFunction={srsLookupFunction}
      itemKeyProp={Srs.keys.code}
      itemLabelFunction={srs =>
        `${Srs.getName(srs)} (EPSG:${Srs.getCode(srs)})`
      }
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
