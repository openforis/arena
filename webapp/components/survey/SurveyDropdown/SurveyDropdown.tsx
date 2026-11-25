import './SurveyDropdown.scss'

import { Dropdown } from '@webapp/components/form'
import { SurveyType } from '@webapp/model'
import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { useSurveyDropdownOptions } from './useSurveyDropdownOptions'

type SurveyDropdownProps = {
  excludedSurveyIds?: any[]
  onChange: (...args: any[]) => any
  selection?: string | number
  testId?: string
  type?: (typeof SurveyType)[keyof typeof SurveyType]
}

const SurveyDropdown = (props: SurveyDropdownProps) => {
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

export { SurveyDropdown }
