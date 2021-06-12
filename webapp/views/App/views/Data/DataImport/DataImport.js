import './DataImport.scss'

import React from 'react'
import { useDispatch } from 'react-redux'

import * as JobSerialized from '@common/job/jobSerialized'

import UploadButton from '@webapp/components/form/uploadButton'

import * as API from '@webapp/service/api'

import { JobActions } from '@webapp/store/app'
import { useI18n } from '@webapp/store/system'
import { useSurveyId } from '@webapp/store/survey'

import { DataTestId } from '@webapp/utils/dataTestId'
import { NotificationActions } from '@webapp/store/ui'

const DataImport = () => {
  const i18n = useI18n()
  const surveyId = useSurveyId()
  const dispatch = useDispatch()

  const onFileChange = (file) => {
    const job = API.importRecordsFromCollect({ surveyId, file })
    dispatch(
      JobActions.showJobMonitor({
        job,
        autoHide: true,
        onComplete: async (jobCompleted) => {
          const { insertedRecords } = JobSerialized.getResult(jobCompleted)
          dispatch(
            NotificationActions.notifyInfo({
              key: 'homeView.recordsImport.importComplete',
              params: { insertedRecords },
            })
          )
        },
      })
    )
  }

  return (
    <div className="data-import">
      <UploadButton
        inputFieldId={DataTestId.recordsImport.importDataBtn}
        label={i18n.t('homeView.recordsImport.importFromCollect')}
        accept=".collect-backup,.collect-data"
        onChange={(files) => onFileChange(files[0])}
      />
    </div>
  )
}

export default DataImport
