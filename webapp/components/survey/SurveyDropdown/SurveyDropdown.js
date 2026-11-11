import './SurveyDropdown.scss'

import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { Dropdown } from '@webapp/components/form'
import { SurveyType } from '@webapp/model'

import { useSurveyDropdownOptions } from './useSurveyDropdownOptions'

const SurveyDropdown = (props) => {
  const {
    excludedSurveyIds = [],
    onChange,
    selection = null,
    testId = TestId.surveyCreate.surveyCloneFrom,
    type = SurveyType.survey,
  } = props
  const { loading, options: allOptions } = useSurveyDropdownOptions({ type })
  const options = allOptions.filter((option) => !excludedSurveyIds.includes(option.value))

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
      testId={testId}
    />
  )
}

SurveyDropdown.propTypes = {
  excludedSurveyIds: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  selection: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  testId: PropTypes.string,
  type: PropTypes.oneOf(Object.values(SurveyType)),
}

export { SurveyDropdown }
