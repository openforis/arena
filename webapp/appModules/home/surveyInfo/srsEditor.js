import React from 'react'
import axios from 'axios'

import Survey from '../../../../common/survey/survey'

import InputChips from '../../../commonComponents/form/inputChips'

const SrsEditor = props => {

  const { surveyInfo, validation, readOnly, updateSurveyInfoProp } = props
  const surveySrs = Survey.getSRS(surveyInfo)

  const srsLookupFunction = async value => {
    const { data } = await axios.get(
      '/api/srs/find',
      { params: { codeOrName: value } }
    )
    return data.srss
  }

  return (
    <InputChips
      itemsLookupFunction={srsLookupFunction}
      itemKeyProp="code"
      itemLabelProp="name"
      selection={surveySrs}
      dropdownAutocompleteMinChars={3}
      requiredItems={1}
      validation={validation}
      onChange={srs => updateSurveyInfoProp('srs', srs)}
      readOnly={readOnly}
    />
  )
}

export default SrsEditor