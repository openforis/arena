import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import Dropdown from '@webapp/components/form/Dropdown'
import * as API from '@webapp/service/api'
import * as Survey from '@core/survey/survey'

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

  const selectedItem = surveys.find((s) => String(Survey.getIdSurveyInfo(s)) === String(selection))

  return (
    <Dropdown
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

export default SurveyDropdown
