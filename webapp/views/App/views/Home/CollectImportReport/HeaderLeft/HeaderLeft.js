import React from 'react'
import PropTypes from 'prop-types'

import { ExportFileNameGenerator } from '@common/dataExport/exportFileNameGenerator'
import { FileFormats } from '@core/fileFormats'
import { ButtonDownload } from '@webapp/components/buttons'
import { Checkbox } from '@webapp/components/form'

import { useSurveyId, useSurveyName } from '@webapp/store/survey'

const HeaderLeft = (props) => {
  const { excludeResolved, setExcludeResolved } = props

  const surveyId = useSurveyId()
  const surveyName = useSurveyName()

  const fileName = ExportFileNameGenerator.generate({
    surveyName,
    fileType: 'collect-report',
    includeTimestamp: true,
    fileFormat: FileFormats.xlsx,
  })

  return (
    <header>
      <Checkbox
        checked={excludeResolved}
        label="homeView:collectImportReport.excludeResolvedItems"
        onChange={(value) => setExcludeResolved(value)}
      />
      <ButtonDownload
        fileName={fileName}
        href={`/api/survey/${surveyId}/collect-import/report/export/`}
        label="common.exportToExcel"
      />
    </header>
  )
}

HeaderLeft.propTypes = {
  excludeResolved: PropTypes.bool.isRequired,
  setExcludeResolved: PropTypes.func.isRequired,
}

export default HeaderLeft
