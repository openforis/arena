import React from 'react'
import axios from 'axios'

import InputChips from '@webapp/components/form/inputChips'

import * as Srs from '@core/geo/srs'
import PropTypes from 'prop-types'

const SrsEditor = (props) => {
  const { srs, validation, readOnly, setSrs } = props

  const srsLookupFunction = async (value) => {
    const { data } = await axios.get('/api/geo/srs/find', {
      params: { codeOrName: value },
    })
    return data.srss
  }

  return (
    <InputChips
      itemsLookupFunction={srsLookupFunction}
      itemKeyProp={Srs.keys.code}
      itemLabelFunction={(srsValue) => `${Srs.getName(srsValue)} (EPSG:${Srs.getCode(srsValue)})`}
      selection={srs}
      dropdownAutocompleteMinChars={3}
      requiredItems={1}
      validation={validation}
      onChange={setSrs}
      readOnly={readOnly}
    />
  )
}

SrsEditor.propTypes = {
  srs: PropTypes.array.isRequired,
  validation: PropTypes.object,
  readOnly: PropTypes.bool.isRequired,
  setSrs: PropTypes.func.isRequired,
}

SrsEditor.defaultProps = {
  validation: {},
}

export default SrsEditor
