import React, { useState } from 'react'
import { useDispatch } from 'react-redux'

import * as JobSerialized from '@common/job/jobSerialized'

import { RecordCycle } from '@core/record/recordCycle'

import * as API from '@webapp/service/api'

import { JobActions } from '@webapp/store/app'
import { useI18n } from '@webapp/store/system'
import { useSurveyCycleKey, useSurveyCycleKeys, useSurveyId } from '@webapp/store/survey'
import { useAuthCanDeleteAllRecords } from '@webapp/store/user'

import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'
import { Button, Dropzone } from '@webapp/components'
import Checkbox from '@webapp/components/form/checkbox'
import { FormItem } from '@webapp/components/form/Input'
import CycleSelector from '@webapp/components/survey/CycleSelector'
import { FileUtils } from '@webapp/utils/fileUtils'

const fileMaxSize = 1000 // 1 GB
const acceptedFileExtensions = ['collect-backup', 'collect-data']
const fileAccept = { '': acceptedFileExtensions.map((ext) => `.${ext}`) } // workaround to accept extensions containing special characters

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
  const [file, setFile] = useState(null)

  const startImportJob = async () => {
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
              key: 'dataImportView.jobs.CollectDataImportJob.importCompleteSuccessfully',
              params: { insertedRecords },
            })
          )
        },
      })
    )
  }

  const onFilesDrop = async (files) => {
    const _file = files.filter((file) => {
      const extension = FileUtils.getExtension(file)
      return acceptedFileExtensions.includes(extension)
    })[0]
    setFile(_file)
  }

  const onStartImportClick = async () => {
    if (deleteAllRecords) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key:
            surveyCycleKeys.length > 1
              ? 'dataImportView.confirmDeleteAllRecordsInCycle'
              : 'dataImportView.confirmDeleteAllRecords',
          params: { cycle: RecordCycle.getLabel(cycle) },
          onOk: async () => startImportJob(),
        })
      )
    } else {
      await startImportJob()
    }
  }

  return (
    <div className="data-import">
      <div className="form">
        <fieldset>
          <legend>{i18n.t('dataImportView.options.header')}</legend>
          {canDeleteAllRecords && (
            <Checkbox
              checked={deleteAllRecords}
              label="dataImportView.deleteAllRecordsBeforeImport"
              onChange={setDeleteAllRecords}
            />
          )}

          {surveyCycleKeys.length > 1 && (
            <FormItem label={i18n.t('dataImportView.importIntoCycle')}>
              <CycleSelector surveyCycleKey={cycle} onChange={setCycle} />
            </FormItem>
          )}

          <Checkbox
            checked={forceImport}
            label="dataImportView.forceImportFromAnotherSurvey"
            onChange={setForceImport}
          />
        </fieldset>

        <Dropzone maxSize={fileMaxSize} onDrop={onFilesDrop} accept={fileAccept} droppedFiles={file ? [file] : []} />

        <Button
          className="btn-primary"
          disabled={!file}
          label="dataImportView.startImport"
          onClick={onStartImportClick}
        />
      </div>
    </div>
  )
}
