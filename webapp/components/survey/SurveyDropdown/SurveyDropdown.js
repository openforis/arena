import './SurveyDropdown.scss'

import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { Dropdown } from '@webapp/components/form'
import { useSurveyDropdownOptions } from './useSurveyDropdownOptions'

const SurveyDropdown = (props) => {
  const { selection = null, onChange } = props
  const { options } = useSurveyDropdownOptions()

  const allOptions = options.reduce((optionsAcc, optionGroup) => [...optionsAcc, ...optionGroup.options], [])
  const selectedOption = allOptions.find((option) => option.value === selection)

  const i18n = useI18n()

  return (
    <Dropdown
      className="survey-dropdown"
      items={options}
      onChange={(item) => onChange(item)}
      placeholder={i18n.t('common.select')}
      renderOptionLabel={({ data }) => {
        const { surveyName, surveyLabel } = data
        return (
          <div className="dropdown-option__label">
            <span className="survey-name">{surveyName}</span>
            {surveyLabel && (
              <>
                <span> - </span>
                <span className="survey-label">{surveyLabel}</span>
              </>
            )}
          </div>
        )
      }}
      selection={selectedOption}
      testId={TestId.surveyCreate.surveyCloneFrom}
    />
  )
}

SurveyDropdown.propTypes = {
  selection: PropTypes.string,
  onChange: PropTypes.func,
}

export { SurveyDropdown }
