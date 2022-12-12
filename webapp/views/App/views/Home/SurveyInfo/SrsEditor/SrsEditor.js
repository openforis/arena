import './SrsEditor.scss'

import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'

import * as Srs from '@core/geo/srs'

import InputChips from '@webapp/components/form/InputChips'

import { useI18n } from '@webapp/store/system'
import { useSurveyId } from '@webapp/store/survey'

const SrsEditor = (props) => {
  const { srs, validation, readOnly, setSrs } = props

  const i18n = useI18n()
  const surveyId = useSurveyId()

  const srsLookupFunction = useCallback(
    async (value) => {
      const { data } = await axios.get(`/api/survey/${surveyId}/geo/srs/find`, {
        params: { codeOrName: value },
      })
      return data.srss
    },
    [surveyId]
  )

  return (
    <InputChips
      className="srs_editor__input_chips"
      items={srsLookupFunction}
      itemKey={Srs.keys.code}
      itemLabel={Srs.getNameAndCode}
      selection={srs}
      minCharactersToAutocomplete={3}
      requiredItems={1}
      validation={validation}
      onChange={setSrs}
      readOnly={readOnly}
      placeholder={i18n.t('homeView.surveyInfo.srsPlaceholder')}
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
