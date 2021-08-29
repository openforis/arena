import './DataImport.scss'

import React, { useState } from 'react'
import { useDispatch } from 'react-redux'

import * as JobSerialized from '@common/job/jobSerialized'

import UploadButton from '@webapp/components/form/uploadButton'

import * as API from '@webapp/service/api'

import { JobActions } from '@webapp/store/app'
import { useI18n } from '@webapp/store/system'
import { useSurveyCycleKey, useSurveyCycleKeys, useSurveyId } from '@webapp/store/survey'
import { useAuthCanDeleteAllRecords } from '@webapp/store/user'

import { DataTestId } from '@webapp/utils/dataTestId'
import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'
import Checkbox from '@webapp/components/form/checkbox'
import { FormItem } from '@webapp/components/form/Input'
import CycleSelector from '@webapp/components/survey/CycleSelector'

const DataImport = () => {
  const i18n = useI18n()
  const surveyId = useSurveyId()
  const surveyCycle = useSurveyCycleKey()
  const surveyCycleKeys = useSurveyCycleKeys()
  const dispatch = useDispatch()
  const canDeleteAllRecords = useAuthCanDeleteAllRecords()

  const [deleteAllRecords, setDeleteAllRecords] = useState(false)
  const [cycle, setCycle] = useState(surveyCycle)
  const [forceImport, setForceImport] = useState(false)

  const startImportJob = async (file) => {
    const job = await API.importRecordsFromCollect({
      surveyId,
      file,
      deleteAllRecords: canDeleteAllRecords && deleteAllRecords,
      cycle,
      forceImport,
    })
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

  const onFileChange = async (file) => {
    if (deleteAllRecords) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'homeView.recordsImport.confirmDeleteAllRecords',
          onOk: async () => startImportJob(file),
        })
      )
    } else {
      await startImportJob(file)
    }
  }

  return (
    <div className="data-import">
      <div className="form">
        {canDeleteAllRecords && (
          <FormItem label={i18n.t('homeView.recordsImport.deleteAllRecordsBeforeImport')}>
            <Checkbox checked={deleteAllRecords} onChange={setDeleteAllRecords} />
          </FormItem>
        )}

        {surveyCycleKeys.length > 1 && (
          <FormItem label={i18n.t('homeView.recordsImport.importIntoCycle')}>
            <CycleSelector surveyCycleKey={cycle} onChange={setCycle} />
          </FormItem>
        )}

        <FormItem label={i18n.t('homeView.recordsImport.forceImportFromAnotherSurvey')}>
          <Checkbox checked={forceImport} onChange={setForceImport} />
        </FormItem>

        <UploadButton
          inputFieldId={DataTestId.recordsImport.importDataBtn}
          label={i18n.t('homeView.recordsImport.importFromCollect')}
          accept=".collect-backup,.collect-data"
          onChange={(files) => onFileChange(files[0])}
        />
      </div>
    </div>
  )
}

export default DataImport
