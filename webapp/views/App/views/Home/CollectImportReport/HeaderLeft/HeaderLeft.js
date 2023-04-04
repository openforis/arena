import React from 'react'
import PropTypes from 'prop-types'

import { ButtonDownload } from '@webapp/components/buttons'
import { Checkbox } from '@webapp/components/form'

import { useSurveyId } from '@webapp/store/survey'

const HeaderLeft = (props) => {
  const { excludeResolved, setExcludeResolved } = props

  const surveyId = useSurveyId()

  return (
    <header>
      <Checkbox
        checked={excludeResolved}
        label="homeView.collectImportReport.excludeResolvedItems"
        onChange={(value) => setExcludeResolved(value)}
      />
      <ButtonDownload href={`/api/survey/${surveyId}/collect-import/report/export/`} label="common.csvExport" />
    </header>
  )
}

HeaderLeft.propTypes = {
  excludeResolved: PropTypes.bool.isRequired,
  setExcludeResolved: PropTypes.func.isRequired,
}

export default HeaderLeft
