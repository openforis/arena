import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'
import PropTypes from 'prop-types'

import { ExportFileNameGenerator } from '@common/dataExport/exportFileNameGenerator'
import { FileFormats } from '@core/fileFormats'

import * as DomUtils from '@webapp/utils/domUtils'
import { ButtonDownload } from '@webapp/components'
import * as API from '@webapp/service/api'
import { JobActions } from '@webapp/store/app'
import { useSurveyCycleKey, useSurveyId, useSurveyName } from '@webapp/store/survey'

const onExportComplete =
  ({ surveyId, surveyName, cycle }) =>
  async (job) => {
    const { tempFileName } = job.result

    const response = await axios.get(`/api/survey/${surveyId}/validationReport/download`, {
      params: { tempFileName },
      responseType: 'blob',
    })

    const outputFileName = ExportFileNameGenerator.generate({
      surveyName,
      cycle,
      fileType: 'ValidationReport',
      fileFormat: FileFormats.xlsx,
    })

    DomUtils.downloadBlobToFile(response.data, outputFileName)
  }

export const HeaderLeft = ({ restParams = {} }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()
  const surveyName = useSurveyName()

  const onExportButtonClick = useCallback(async () => {
    const job = await API.startValidationReportGeneration({ surveyId, ...restParams })
    dispatch(
      JobActions.showJobMonitor({ autoHide: true, job, onComplete: onExportComplete({ surveyId, surveyName, cycle }) })
    )
  }, [cycle, dispatch, restParams, surveyId, surveyName])

  return <ButtonDownload className="btn-csv-export" onClick={onExportButtonClick} label="common.exportToExcel" />
}

HeaderLeft.propTypes = {
  restParams: PropTypes.object,
}
