import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { ButtonDownload } from '@webapp/components'
import * as API from '@webapp/service/api'
import { JobActions } from '@webapp/store/app'
import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'

const onExportComplete =
  ({ surveyId, cycle }) =>
  (job) => {
    const { tempFileName } = job.result
    const downloadUrl = API.getValidationReportDownloadUrl({
      surveyId,
      cycle,
      tempFileName,
    })
    window.open(downloadUrl, '_blank')
  }

export const HeaderLeft = ({ restParams = {} }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()

  const onExportButtonClick = useCallback(async () => {
    const job = await API.startValidationReportGeneration({ surveyId, ...restParams })
    dispatch(JobActions.showJobMonitor({ autoHide: true, job, onComplete: onExportComplete({ surveyId, cycle }) }))
  }, [dispatch, surveyId])

  return <ButtonDownload className="btn-csv-export" onClick={onExportButtonClick} label="common.exportToExcel" />
}

HeaderLeft.propTypes = {
  restParams: PropTypes.object,
}
