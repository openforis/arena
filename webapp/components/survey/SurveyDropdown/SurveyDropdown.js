import './SurveyDropdown.scss'

import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { Dropdown } from '@webapp/components/form'
import { SurveyType } from '@webapp/model'

import { useSurveyDropdownOptions } from './useSurveyDropdownOptions'

const SurveyDropdown = (props) => {
  const { onChange, selection = null, type = SurveyType.survey } = props
  const { loading, options } = useSurveyDropdownOptions({ type })

  const selectedOption = options.find((option) => option.value === selection)

  const i18n = useI18n()

  return (
    <Dropdown
      className="survey-dropdown"
      items={options}
      loading={loading}
      onChange={(item) => onChange(item)}
      placeholder={i18n.t('common.select')}
      renderOptionLabel={(params) => {
        const { data } = params
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
  onChange: PropTypes.func.isRequired,
  selection: PropTypes.string,
  type: PropTypes.oneOf(Object.values(SurveyType)),
}

export { SurveyDropdown }
