import React, { useState } from 'react'
import { useDispatch } from 'react-redux'

import * as JobSerialized from '@common/job/jobSerialized'

import UploadButton from '@webapp/components/form/uploadButton'

import * as API from '@webapp/service/api'

import { JobActions } from '@webapp/store/app'
import { useI18n } from '@webapp/store/system'
import { useSurveyCycleKey, useSurveyCycleKeys, useSurveyId } from '@webapp/store/survey'
import { useAuthCanDeleteAllRecords } from '@webapp/store/user'

import { TestId } from '@webapp/utils/testId'
import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'
import Checkbox from '@webapp/components/form/checkbox'
import { FormItem } from '@webapp/components/form/Input'
import CycleSelector from '@webapp/components/survey/CycleSelector'

export const CollectDataImportView = () => {
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
    const job = await API.startCollectRecordsImportJob({
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
              key: 'dataImportView.importComplete',
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
          key:
            surveyCycleKeys.length > 1
              ? 'dataImportView.confirmDeleteAllRecordsInCycle'
              : 'dataImportView.confirmDeleteAllRecords',
          params: { cycle: Number(cycle) + 1 },
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
          <FormItem label={i18n.t('dataImportView.deleteAllRecordsBeforeImport')}>
            <Checkbox checked={deleteAllRecords} onChange={setDeleteAllRecords} />
          </FormItem>
        )}

        {surveyCycleKeys.length > 1 && (
          <FormItem label={i18n.t('dataImportView.importIntoCycle')}>
            <CycleSelector surveyCycleKey={cycle} onChange={setCycle} />
          </FormItem>
        )}

        <FormItem label={i18n.t('dataImportView.forceImportFromAnotherSurvey')}>
          <Checkbox checked={forceImport} onChange={setForceImport} />
        </FormItem>

        <UploadButton
          inputFieldId={TestId.recordsImport.importDataBtn}
          label={i18n.t('dataImportView.importFromCollect')}
          accept=".collect-backup,.collect-data"
          onChange={(files) => onFileChange(files[0])}
        />
      </div>
    </div>
  )
}
