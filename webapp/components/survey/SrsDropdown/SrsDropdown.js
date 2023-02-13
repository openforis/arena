import React from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as Srs from '@core/geo/srs'

import { useSurveyInfo } from '@webapp/store/survey'
import { Dropdown } from '@webapp/components/form'

const SrsDropdown = (props) => {
  const { disabled, onChange, readOnly, selectedSrsCode, testId } = props

  const surveyInfo = useSurveyInfo()
  const surveySrs = Survey.getSRS(surveyInfo)
  const singleSrs = surveySrs.length === 1
  const selectedSrs = singleSrs ? surveySrs[0] : surveySrs.find((srs) => srs.code === selectedSrsCode)

  return (
    <Dropdown
      disabled={disabled || singleSrs}
      items={surveySrs}
      itemValue="code"
      itemLabel={Srs.getNameAndCode}
      onChange={onChange}
      readOnly={readOnly}
      selection={selectedSrs}
      testId={testId}
    />
  )
}

SrsDropdown.propTypes = {
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  selectedSrsCode: PropTypes.string,
  testId: PropTypes.string,
}

SrsDropdown.defaultProps = {
  disabled: false,
  readOnly: false,
  selectedSrsCode: null,
}

export default SrsDropdown
