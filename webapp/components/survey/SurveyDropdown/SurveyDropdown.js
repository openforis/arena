import './SurveyDropdown.scss'

import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { Dropdown } from '@webapp/components/form'
import { useSurveyDropdownOptions } from './useSurveyDropdownOptions'

const SurveyDropdown = (props) => {
  const { selection, onChange } = props
  const { options } = useSurveyDropdownOptions()

  const allOptions = options.reduce((optionsAcc, optionGroup) => [...optionsAcc, ...optionGroup.options], [])
  const selectedOption = allOptions.find((option) => option.value === selection)

  const i18n = useI18n()

  return (
    <Dropdown
      className="survey-dropdown"
      items={options}
      onChange={(item) => onChange(item?.value)}
      placeholder={i18n.t('common.select')}
      renderOptionLabel={({ data }) => {
        const { name, label } = data
        return (
          <div className="dropdown-option__label">
            <span className="survey-name">{name}</span>
            {label && (
              <>
                <span> - </span>
                <span className="survey-label">{label}</span>
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

SurveyDropdown.defaultProps = {
  selection: null,
  onChange: () => ({}),
}

export { SurveyDropdown }
