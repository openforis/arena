import './DataImport.scss'

import React, { useState } from 'react'
import { useDispatch } from 'react-redux'

import * as JobSerialized from '@common/job/jobSerialized'

import UploadButton from '@webapp/components/form/uploadButton'

import * as API from '@webapp/service/api'

import { JobActions } from '@webapp/store/app'
import { useI18n } from '@webapp/store/system'
import { useSurveyId } from '@webapp/store/survey'

import { DataTestId } from '@webapp/utils/dataTestId'
import { NotificationActions } from '@webapp/store/ui'
import Checkbox from '@webapp/components/form/checkbox'
import { FormItem } from '@webapp/components/form/Input'

const DataImport = () => {
  const i18n = useI18n()
  const surveyId = useSurveyId()
  const dispatch = useDispatch()

  const [deleteAllRecords, setDeleteAllRecords] = useState(false)

  const onFileChange = async (file) => {
    const job = await API.importRecordsFromCollect({ surveyId, file, deleteAllRecords })
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
      <FormItem label={i18n.t('homeView.recordsImport.deleteAllRecordsBeforeImport')}>
        <Checkbox checked={deleteAllRecords} onChange={setDeleteAllRecords} />
      </FormItem>
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
