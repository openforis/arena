import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'

import * as API from '@webapp/service/api'
import { useI18n } from '@webapp/store/system'
import { DataTestId } from '@webapp/utils/dataTestId'

import Dropdown from '@webapp/components/form/Dropdown'

const SurveyDropdown = (props) => {
  const { selection, onChange } = props
  const [surveys, setSurveys] = useState([])

  const i18n = useI18n()

  useEffect(() => {
    ;(async () => {
      const fetchedSurveys = await API.fetchSurveys()
      setSurveys(fetchedSurveys)
    })()
  }, [])

  const selectedItem = surveys.find((survey) => String(Survey.getIdSurveyInfo(survey)) === String(selection))

  return (
    <Dropdown
      idInput={DataTestId.surveyCreate.surveyCloneFrom}
      placeholder={i18n.t('common.cloneFrom')}
      items={surveys}
      selection={selectedItem}
      onChange={(e) => onChange(e ? e.id : null)}
      itemLabel={Survey.getName}
      itemKey={Survey.infoKeys.id}
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
