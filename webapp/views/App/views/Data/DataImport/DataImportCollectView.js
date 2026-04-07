import React, { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'

import * as JobSerialized from '@common/job/jobSerialized'

import { RecordCycle } from '@core/record/recordCycle'

import * as API from '@webapp/service/api'

import { JobActions } from '@webapp/store/app'
import { useI18n, useSystemConfigFileUploadLimitMB } from '@webapp/store/system'
import { useSurveyCycleKey, useSurveyCycleKeys, useSurveyId } from '@webapp/store/survey'
import { useAuthCanDeleteAllRecords } from '@webapp/store/user'

import { DialogConfirmActions } from '@webapp/store/ui'
import { Dropzone } from '@webapp/components'
import Checkbox from '@webapp/components/form/checkbox'
import { FormItem } from '@webapp/components/form/Input'
import CycleSelector from '@webapp/components/survey/CycleSelector'
import { FileUtils } from '@webapp/utils/fileUtils'

import { ImportStartButton } from './ImportStartButton'

const acceptedFileExtensions = ['collect-backup', 'collect-data']
const fileAccept = { '': acceptedFileExtensions.map((ext) => `.${ext}`) } // workaround to accept extensions containing special characters

export const CollectDataImportView = () => {
  const i18n = useI18n()
  const surveyId = useSurveyId()
  const surveyCycle = useSurveyCycleKey()
  const surveyCycleKeys = useSurveyCycleKeys()
  const dispatch = useDispatch()
  const canDeleteAllRecords = useAuthCanDeleteAllRecords()
  const fileMaxSizeMB = useSystemConfigFileUploadLimitMB()

  const [deleteAllRecords, setDeleteAllRecords] = useState(false)
  const [cycle, setCycle] = useState(surveyCycle)
  const [forceImport, setForceImport] = useState(false)
  const [file, setFile] = useState(null)

  const onJobComplete = useCallback(
    async (jobCompleted) => {
      const { insertedRecords } = JobSerialized.getResult(jobCompleted)
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'dataImportView:jobs.CollectDataImportJob.importCompleteSuccessfully',
          params: { insertedRecords },
          dismissable: false,
        })
      )
    },
    [dispatch]
  )

  const onJobStart = useCallback(
    (job) => {
      dispatch(
        JobActions.showJobMonitor({
          job,
          autoHide: true,
          onComplete: onJobComplete,
        })
      )
    },
    [dispatch, onJobComplete]
  )

  const onFilesDrop = async (files) => {
    const _file = files.filter((file) => {
      const extension = FileUtils.getExtension(file)
      return acceptedFileExtensions.includes(extension)
    })[0]
    setFile(_file)
  }

  return (
    <div className="data-import">
      <div className="form">
        <fieldset>
          <legend>{i18n.t('dataImportView:options.header')}</legend>
          {canDeleteAllRecords && (
            <Checkbox
              checked={deleteAllRecords}
              label="dataImportView:deleteAllRecordsBeforeImport"
              onChange={setDeleteAllRecords}
            />
          )}

          {surveyCycleKeys.length > 1 && (
            <FormItem className="display-flex" label="dataImportView:importIntoCycle">
              <CycleSelector selectedCycle={cycle} onChange={setCycle} />
            </FormItem>
          )}

          <Checkbox
            checked={forceImport}
            label="dataImportView:forceImportFromAnotherSurvey"
            onChange={setForceImport}
          />
        </fieldset>

        <Dropzone maxSize={fileMaxSizeMB} onDrop={onFilesDrop} accept={fileAccept} droppedFiles={file ? [file] : []} />

        <ImportStartButton
          disabled={!file}
          confirmMessageKey={
            surveyCycleKeys.length > 1
              ? 'dataImportView:confirmDeleteAllRecordsInCycle'
              : 'dataImportView:confirmDeleteAllRecords'
          }
          confirmMessageParams={{ cycle: RecordCycle.getLabel(cycle) }}
          showConfirm={deleteAllRecords}
          startFunction={API.startCollectRecordsImportJob}
          startFunctionParams={{
            surveyId,
            file,
            deleteAllRecords: canDeleteAllRecords && deleteAllRecords,
            cycle,
            forceImport,
          }}
          onUploadComplete={onJobStart}
        />
      </div>
    </div>
  )
}
