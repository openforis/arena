import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import Select from '@webapp/components/form/Select'
import { useOptions } from './useOptions'

const SurveyDropdown = (props) => {
  const { selection, onChange } = props
  const { options } = useOptions()

  const allOptions = options.reduce((optionsAcc, optionGroup) => [...optionsAcc, ...optionGroup.options], [])
  const selectedOption = allOptions.find((option) => option.value === selection)

  const i18n = useI18n()

  return (
    <Select
      id={TestId.surveyCreate.surveyCloneFrom}
      options={options}
      value={selectedOption}
      onChange={(item) => onChange(item.value)}
      placeholder={i18n.t('common.cloneFrom')}
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
